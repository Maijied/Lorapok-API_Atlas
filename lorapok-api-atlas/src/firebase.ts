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
