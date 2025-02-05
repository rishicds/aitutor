"use client"
import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebaseConfig"
import { useRouter } from "next/navigation"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: displayName || "",
        tokens: 100, 
        createdAt: new Date(),
        lastLogin: new Date(),
        role: "user",
        active: true
      })

      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      setError("Failed to create an account")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Sign Up</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display Name (Optional)"
          className="w-full px-3 py-2 mb-4 text-gray-700 border rounded-lg focus:outline-none"
        />
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
          className="w-full px-3 py-2 text-white bg-green-500 rounded-lg focus:outline-none hover:bg-green-600"
        >
          Sign Up
        </button>
      </form>
    </div>
  )
}