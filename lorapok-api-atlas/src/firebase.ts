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
