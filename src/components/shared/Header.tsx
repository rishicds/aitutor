"use client"

import Link from "next/link"
import { useAuthState } from "react-firebase-hooks/auth"
import {auth} from "@/lib/firebaseConfig"
import { signOut } from "firebase/auth"

export default function Header() {
  const [user] = useAuthState(auth)

  return (
    <header className="bg-black shadow-md">
      <nav className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold neon-glow">
            AI Tutor
          </Link>
          <div>
            {user ? (
              <>
                <Link href="/dashboard" className="mr-4 hover:text-primary transition duration-300">
                  Dashboard
                </Link>
                <Link href="/pyq" className="mr-4 hover:text-primary transition duration-300">
                  PYQs
                </Link>
                <Link href="/purchase-tokens" className="mr-4 hover:text-primary transition duration-300">
                  Purchase Tokens
                </Link>
                <button
                  onClick={() => signOut(auth)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className="mr-4 hover:text-primary transition duration-300">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-primary-foreground hover:bg-opacity-80 font-bold py-2 px-4 rounded transition duration-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

