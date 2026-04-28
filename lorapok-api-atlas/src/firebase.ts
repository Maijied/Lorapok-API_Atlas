import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'

// ─── Replace these with your Firebase project config ─────────────────────────
// Go to: https://console.firebase.google.com → New Project → Web App → Copy config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export type { User }

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const signOutUser = () => signOut(auth)
export const onAuthChange = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb)

// ─── Firestore key helpers ────────────────────────────────────────────────────
// Path: users/{uid}/apikeys/{apiName}  →  { key: "..." }

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
