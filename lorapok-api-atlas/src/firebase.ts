import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'

// ─── Firebase config from environment variables ───────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export type { User }

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const signOutUser = () => signOut(auth)
export const onAuthChange = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb)

export async function saveApiKey(uid: string, apiName: string, key: string) {
  const ref = doc(db, 'users', uid, 'apikeys', apiName)
  await setDoc(ref, { key, updatedAt: Date.now() })
}

export async function getApiKey(uid: string, apiName: string): Promise<string> {
  const ref = doc(db, 'users', uid, 'apikeys', apiName)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data().key as string) : ''
}

export async function deleteApiKey(uid: string, apiName: string) {
  const ref = doc(db, 'users', uid, 'apikeys', apiName)
  await deleteDoc(ref)
}

export async function getAllApiKeys(uid: string): Promise<Record<string, string>> {
  const colRef = collection(db, 'users', uid, 'apikeys')
  const snap = await getDocs(colRef)
  const result: Record<string, string> = {}
  snap.forEach(d => { result[d.id] = d.data().key })
  return result
}

// ─── Vaultie Chat Storage ─────────────────────────────────────────────────────
// Path: vaultie_chats/{uid}/messages/{auto-id} → { role, content, ts }
import { addDoc, query, orderBy, limit, onSnapshot, type Unsubscribe } from 'firebase/firestore'

export async function saveChatMessage(uid: string, role: 'user' | 'assistant', content: string) {
  const colRef = collection(db, 'vaultie_chats', uid, 'messages')
  await addDoc(colRef, { role, content, ts: Date.now() })
}

export function subscribeChatHistory(
  uid: string,
  cb: (msgs: { role: 'user' | 'assistant'; content: string }[]) => void
): Unsubscribe {
  const colRef = collection(db, 'vaultie_chats', uid, 'messages')
  const q = query(colRef, orderBy('ts', 'asc'), limit(100))
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ role: d.data().role, content: d.data().content })))
  })
}

// ─── Collections (Favorites) ──────────────────────────────────────────────────
// Path: users/{uid}/collections/{collectionId} → { name, apiNames[], createdAt }
import { updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

export async function getUserCollections(uid: string) {
  const colRef = collection(db, 'users', uid, 'collections')
  const snap = await getDocs(colRef)
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as { id: string; name: string; apiNames: string[]; createdAt: number }[]
}

export async function createCollection(uid: string, name: string) {
  const colRef = collection(db, 'users', uid, 'collections')
  return addDoc(colRef, { name, apiNames: [], createdAt: Date.now() })
}

export async function addToCollection(uid: string, collectionId: string, apiName: string) {
  const ref = doc(db, 'users', uid, 'collections', collectionId)
  await updateDoc(ref, { apiNames: arrayUnion(apiName) })
}

export async function removeFromCollection(uid: string, collectionId: string, apiName: string) {
  const ref = doc(db, 'users', uid, 'collections', collectionId)
  await updateDoc(ref, { apiNames: arrayRemove(apiName) })
}

export async function deleteCollection(uid: string, collectionId: string) {
  const ref = doc(db, 'users', uid, 'collections', collectionId)
  await deleteDoc(ref)
}

// ─── Request History ──────────────────────────────────────────────────────────
// Path: users/{uid}/history/{auto-id} → { apiName, url, status, ts, preview }
export async function saveRequestHistory(uid: string, entry: { apiName: string; url: string; status: 'success' | 'error' | 'cors'; preview: string }) {
  const colRef = collection(db, 'users', uid, 'history')
  await addDoc(colRef, { ...entry, ts: Date.now() })
  // Keep only last 50 — cleanup old ones (no orderBy to avoid index requirement)
  const snap = await getDocs(colRef)
  if (snap.size > 50) {
    const sorted = snap.docs.sort((a, b) => (a.data().ts || 0) - (b.data().ts || 0))
    const toDelete = sorted.slice(0, snap.size - 50)
    await Promise.all(toDelete.map(d => deleteDoc(d.ref)))
  }
}

export async function getRequestHistory(uid: string) {
  const colRef = collection(db, 'users', uid, 'history')
  // Avoid composite index requirement — fetch all and sort client-side
  const snap = await getDocs(colRef)
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as { id: string; apiName: string; url: string; status: string; preview: string; ts: number }[]
  return all.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 20)
}

// ─── Environment Variables ────────────────────────────────────────────────────
// Path: users/{uid}/envvars/global → { vars: { key: value } }
export async function getEnvVars(uid: string): Promise<Record<string, string>> {
  const ref = doc(db, 'users', uid, 'envvars', 'global')
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data().vars as Record<string, string>) : {}
}

export async function saveEnvVars(uid: string, vars: Record<string, string>) {
  const ref = doc(db, 'users', uid, 'envvars', 'global')
  await setDoc(ref, { vars, updatedAt: Date.now() })
}

// ─── Vaultie Memory ───────────────────────────────────────────────────────────
// Path: users/{uid}/vaultie_memory/prefs → { recentApis[], favoriteCategories[], theme }
export async function getVaultieMemory(uid: string) {
  const ref = doc(db, 'users', uid, 'vaultie_memory', 'prefs')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : { recentApis: [], favoriteCategories: [], theme: 'dark' }
}

export async function updateVaultieMemory(uid: string, data: Partial<{ recentApis: string[]; favoriteCategories: string[]; theme: string }>) {
  const ref = doc(db, 'users', uid, 'vaultie_memory', 'prefs')
  await setDoc(ref, data, { merge: true })
}

// ─── Saved Snippets ───────────────────────────────────────────────────────────
// Path: users/{uid}/snippets/{id} → { name, apiName, url, method, headers, body, ts }
export async function saveSnippet(uid: string, snippet: { name: string; apiName: string; url: string; method: string; headers: Record<string,string>; body: string }) {
  const colRef = collection(db, 'users', uid, 'snippets')
  return addDoc(colRef, { ...snippet, ts: Date.now() })
}
export async function getSnippets(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'snippets'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as { id: string; name: string; apiName: string; url: string; method: string; headers: Record<string,string>; body: string; ts: number }[]
}
export async function deleteSnippet(uid: string, id: string) {
  await deleteDoc(doc(db, 'users', uid, 'snippets', id))
}

// ─── Ratings & Reviews ────────────────────────────────────────────────────────
// Path: ratings/{apiName}/reviews/{uid} → { rating, review, displayName, ts }
export async function rateApi(uid: string, displayName: string, apiName: string, rating: number, review: string) {
  const ref = doc(db, 'ratings', apiName, 'reviews', uid)
  await setDoc(ref, { rating, review, displayName, ts: Date.now() })
}
export async function getApiRatings(apiName: string) {
  const snap = await getDocs(collection(db, 'ratings', apiName, 'reviews'))
  const reviews = snap.docs.map(d => d.data()) as { rating: number; review: string; displayName: string; ts: number }[]
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  return { avg: Math.round(avg * 10) / 10, count: reviews.length, reviews }
}

// ─── Trending (anonymous test counts) ────────────────────────────────────────
// Path: trending/{apiName} → { count, lastTested }
import { increment } from 'firebase/firestore'
export async function trackApiTest(apiName: string) {
  const ref = doc(db, 'trending', apiName)
  await setDoc(ref, { count: increment(1), lastTested: Date.now(), name: apiName }, { merge: true })
}
export async function getTrending(limit_n = 10) {
  const snap = await getDocs(collection(db, 'trending'))
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as { id: string; name: string; count: number; lastTested: number }[]
  return all.sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, limit_n)
}

// ─── Visitor / User counters ──────────────────────────────────────────────────
// Path: stats/global → { visitors, registeredUsers }
export async function incrementVisitor() {
  const ref = doc(db, 'stats', 'global')
  await setDoc(ref, { visitors: increment(1) }, { merge: true })
}
export async function incrementRegisteredUser() {
  const ref = doc(db, 'stats', 'global')
  await setDoc(ref, { registeredUsers: increment(1) }, { merge: true })
}
export async function getStats() {
  const snap = await getDoc(doc(db, 'stats', 'global'))
  return snap.exists() ? snap.data() as { visitors: number; registeredUsers: number } : { visitors: 0, registeredUsers: 0 }
}

// ─── Personal Usage Dashboard ─────────────────────────────────────────────────
export async function getUserStats(uid: string) {
  const histSnap = await getDocs(collection(db, 'users', uid, 'history'))
  const history = histSnap.docs.map(d => d.data()) as { apiName: string; status: string; ts: number }[]
  const total = history.length
  const success = history.filter(h => h.status === 'success').length
  const cors = history.filter(h => h.status === 'cors').length
  const errors = history.filter(h => h.status === 'error').length
  const apiCounts: Record<string, number> = {}
  history.forEach(h => { apiCounts[h.apiName] = (apiCounts[h.apiName] || 0) + 1 })
  const topApis = Object.entries(apiCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
  return { total, success, cors, errors, successRate: total ? Math.round(success / total * 100) : 0, topApis }
}

// ─── Admin System ─────────────────────────────────────────────────────────────
// Path: admins/{email} → { role: 'admin'|'moderator', addedBy, secretKey, code, ts }
export const MASTER_ADMIN = 'mdshuvo40@gmail.com'

export async function isAdmin(email: string): Promise<{ allowed: boolean; role: string }> {
  if (email === MASTER_ADMIN) return { allowed: true, role: 'master' }
  const ref = doc(db, 'admins', email.replace(/\./g, '_'))
  const snap = await getDoc(ref)
  if (snap.exists()) return { allowed: true, role: snap.data().role }
  return { allowed: false, role: '' }
}

export async function addAdmin(email: string, role: 'admin' | 'moderator', secretKey: string, code: string, addedBy: string) {
  const ref = doc(db, 'admins', email.replace(/\./g, '_'))
  await setDoc(ref, { email, role, secretKey, code, addedBy, ts: Date.now() })
}

export async function getAdmins() {
  const snap = await getDocs(collection(db, 'admins'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as { id: string; email: string; role: string; addedBy: string; ts: number; code?: string }[]
}

export async function removeAdmin(email: string) {
  await deleteDoc(doc(db, 'admins', email.replace(/\./g, '_')))
}

// ─── Admin: fetch all users data ──────────────────────────────────────────────
export async function getAllUsersData() {
  const statsSnap = await getDoc(doc(db, 'stats', 'global'))
  const stats = statsSnap.exists() ? statsSnap.data() : {}

  // Get trending data
  const trendingSnap = await getDocs(collection(db, 'trending'))
  const trending = trendingSnap.docs.map(d => ({ name: d.id, ...d.data() }))
    .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))

  // Use collectionGroup to find all reviews across all ratings/{apiName}/reviews
  // This works even when the parent ratings/{apiName} doc doesn't exist as a real document
  const { collectionGroup } = await import('firebase/firestore')
  const reviewsSnap = await getDocs(collectionGroup(db, 'reviews'))
  const ratingCounts: Record<string, number> = {}
  reviewsSnap.docs.forEach(d => {
    // Path: ratings/{apiName}/reviews/{uid}
    const apiName = d.ref.parent.parent?.id
    if (apiName) ratingCounts[apiName] = (ratingCounts[apiName] || 0) + 1
  })
  const ratings = Object.entries(ratingCounts)
    .map(([apiName, count]) => ({ apiName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return { stats, trending: trending.slice(0, 20), ratings }
}

// ─── Admin: fetch specific user data ─────────────────────────────────────────
export async function getUserData(uid: string) {
  const [keysSnap, histSnap, colSnap, snippetsSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'apikeys')),
    getDocs(collection(db, 'users', uid, 'history')),
    getDocs(collection(db, 'users', uid, 'collections')),
    getDocs(collection(db, 'users', uid, 'snippets')),
  ])
  return {
    apiKeys: keysSnap.docs.map(d => ({ name: d.id, ...d.data() })),
    history: histSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0)).slice(0, 20),
    collections: colSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    snippets: snippetsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  }
}
