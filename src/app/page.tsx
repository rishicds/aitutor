"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebaseConfig"
import { useRouter } from "next/navigation"

export default function Home() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
      <h1 className="text-4xl font-bold mb-8">Welcome to AI Tutor</h1>
      <p className="mb-4">Your AI-powered learning companion</p>
      <div className="flex space-x-4">
        <Link href="/signin" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Sign In
        </Link>
        <Link href="/signup" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Sign Up
        </Link>
      </div>
    </div>
  )
}