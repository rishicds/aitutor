"use client"
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebaseConfig"
import { useRouter } from "next/navigation"
import type React from "react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update last login timestamp in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: new Date()
      })

      router.push("/dashboard")
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Firebase: Error (auth/invalid-credential).":
            setError("Invalid email or password")
            break
          case "Firebase: Error (auth/user-disabled).":
            setError("Account has been disabled")
            break
          default:
            setError("Failed to sign in")
        }
        console.error(error)
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Sign In</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full px-3 py-2 mb-4 text-gray-700 border rounded-lg focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full px-3 py-2 mb-4 text-gray-700 border rounded-lg focus:outline-none"
        />
        <button
          type="submit"
          className="w-full px-3 py-2 text-white bg-blue-500 rounded-lg focus:outline-none hover:bg-blue-600"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}