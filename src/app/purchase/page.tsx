"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, updateDoc, increment } from "firebase/firestore"

const tokenPackages = [
  { id: "basic", tokens: 100, price: 499 },
  { id: "standard", tokens: 500, price: 1999 },
  { id: "premium", tokens: 1000, price: 3499 },
]

export default function PurchaseTokens() {
  const [user] = useAuthState(auth)
  const [selectedPackage, setSelectedPackage] = useState(tokenPackages[0])

  const handlePurchase = async () => {
    if (!user) return

    // TODO: Implement Razorpay integration here

    // For now, we'll just update the user's tokens in Firestore
    const userRef = doc(db, "users", user.uid)
    await updateDoc(userRef, {
      tokens: increment(selectedPackage.tokens),
    })

    alert(`Successfully purchased ${selectedPackage.tokens} tokens!`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center neon-glow">Purchase Tokens</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tokenPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`glassmorphism p-6 cursor-pointer ${selectedPackage.id === pkg.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedPackage(pkg)}
          >
            <h2 className="text-2xl font-semibold mb-4">{pkg.tokens} Tokens</h2>
            <p className="text-3xl font-bold mb-4">₹{pkg.price / 100}</p>
            <button
              onClick={handlePurchase}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-opacity-80 transition duration-300"
            >
              Purchase
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

