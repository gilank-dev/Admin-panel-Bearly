'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User } from 'firebase/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initAuth = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')
        const { getFirestore, doc, getDoc } = await import('firebase/firestore')
        const { getFirebaseApp } = await import('@/lib/firebase')

        const app = await getFirebaseApp()
        if (!app) {
          setLoading(false)
          return
        }

        const auth = getAuth(app)
        const db = getFirestore(app)

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser)
            // Check if admin
            const configRef = doc(db, 'config', 'admin')
            const configSnap = await getDoc(configRef)
            if (configSnap.exists()) {
              const adminEmails = configSnap.data().adminEmails || []
              setIsAdmin(adminEmails.includes(firebaseUser.email || ''))
            }
          } else {
            setUser(null)
            setIsAdmin(false)
          }
          setLoading(false)
        })
      } catch (error) {
        console.error('Auth initialization error:', error)
        setLoading(false)
      }
    }

    initAuth()

    return () => {
      unsubscribe?.()
    }
  }, [])

  const signIn = useCallback(async () => {
    try {
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
      const { getFirebaseApp } = await import('@/lib/firebase')

      const app = await getFirebaseApp()
      if (!app) throw new Error('Firebase not initialized')

      const auth = getAuth(app)
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }, [])

  const logOut = useCallback(async () => {
    try {
      const { getAuth, signOut } = await import('firebase/auth')
      const { getFirebaseApp } = await import('@/lib/firebase')

      const app = await getFirebaseApp()
      if (!app) throw new Error('Firebase not initialized')

      const auth = getAuth(app)
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [])

  return { user, loading, isAdmin, signIn, logOut }
}
