"use client"

import React, { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, updateDoc, increment, getDoc } from "firebase/firestore"
import { Check, Sparkles, Star, Zap, CreditCard, Gift, ShieldCheck, Clock } from "lucide-react"

const tokenPackages = [
  { 
    id: "basic", 
    tokens: 100, 
    price: 499,
    color: "from-lavender-300 to-lavender-500",
    icon: <Zap className="h-6 w-6 mb-2 text-black" />,
    perks: ["Basic API access", "Email support", "7-day history"]
  },
  { 
    id: "standard", 
    tokens: 500, 
    price: 1999,
    color: "from-lavender-400 to-lavender-600",
    icon: <Star className="h-6 w-6 mb-2 text-black" />,
    perks: ["Full API access", "Priority support", "30-day history", "Advanced templates"] 
  },
  { 
    id: "premium", 
    tokens: 1000, 
    price: 3499,
    color: "from-lavender-500 to-lavender-700",
    icon: <Sparkles className="h-6 w-6 mb-2 text-black" />,
    perks: ["Unlimited API access", "24/7 support", "90-day history", "Custom templates", "Priority processing"]
  },
  { 
    id: "enterprise", 
    tokens: 2500, 
    price: 7999,
    color: "from-lavender-600 to-lavender-800",
    icon: <ShieldCheck className="h-6 w-6 mb-2 text-black" />,
    perks: ["Unlimited everything", "Dedicated account manager", "Custom integration", "White-label options", "SLA guarantees"]
  }
]

export default function PurchaseTokens() {
  const [user] = useAuthState(auth)
  const [selectedPackage, setSelectedPackage] = useState(tokenPackages[1])
  const [currentTokens, setCurrentTokens] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const fetchUserTokens = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setCurrentTokens(userDoc.data().tokens || 0)
          }
        } catch (error) {
          console.error("Error fetching user tokens:", error)
        }
      }
    }

    fetchUserTokens()
  }, [user])

  const handlePurchase = async () => {
    if (!user) return
    setLoading(true)

    try {
      // TODO: Implement Razorpay integration here
      
      // For now, we'll just update the user's tokens in Firestore
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        tokens: increment(selectedPackage.tokens),
      })
      
      setCurrentTokens(currentTokens + selectedPackage.tokens)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    } catch (error) {
      console.error("Error purchasing tokens:", error)
      alert("Failed to purchase tokens. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Simulated coupon functionality
  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState(0)
  
  const applyCoupon = () => {
    if (couponCode.toLowerCase() === "welcome10") {
      setDiscount(10)
    } else if (couponCode.toLowerCase() === "premium20") {
      setDiscount(20)
    } else {
      alert("Invalid coupon code")
      setDiscount(0)
    }
  }

  const calculateFinalPrice = () => {
    return (selectedPackage.price * (100 - discount)) / 100
  }

  return (
    <div className="container mx-auto px-4 py-8 relative bg-white">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: ['#C8B6E2', '#9575CD', '#7E57C2', '#B39DDB', '#D1C4E9'][Math.floor(Math.random() * 5)],
                animationDuration: `${Math.random() * 2 + 1}s`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-lavender-400 to-lavender-700 bg-clip-text text-transparent">
          Power Up Your Experience
        </h1>
        <p className="text-xl max-w-2xl mx-auto text-black">
          Purchase tokens to unlock the full potential of our AI services. More tokens, more possibilities.
        </p>
      </div>

      {user && (
        <div className="flex justify-center mb-8">
          <div className="white-card px-8 py-4 flex items-center space-x-4 rounded-full shadow-md">
            <div className="h-12 w-12 bg-gradient-to-r from-lavender-400 to-lavender-600 rounded-full flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-black">Current Balance</p>
              <p className="text-2xl font-bold text-black">{currentTokens} Tokens</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {tokenPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`white-card p-6 rounded-xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${
              selectedPackage.id === pkg.id ? "ring-2 ring-lavender-500 shadow-lg shadow-lavender-200" : ""
            }`}
            onClick={() => setSelectedPackage(pkg)}
          >
            <div className={`h-16 w-16 rounded-full bg-gradient-to-r ${pkg.color} flex items-center justify-center mb-4`}>
              {pkg.icon}
            </div>
            <div className="flex items-baseline mb-2">
              <h2 className="text-2xl font-bold text-black">{pkg.tokens}</h2>
              <span className="ml-2 text-gray-600">Tokens</span>
            </div>
            <div className="flex items-baseline mb-6">
              <span className="text-gray-600 text-sm">₹</span>
              <p className="text-3xl font-bold text-black">{pkg.price / 100}</p>
              <span className="ml-2 text-gray-600 text-xs">INR</span>
            </div>
            <ul className="space-y-2 mb-6">
              {pkg.perks.map((perk, i) => (
                <li key={i} className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-lavender-600" />
                  <span className="text-sm text-black">{perk}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPackage(pkg);
              }}
              className={`w-full py-2 px-4 rounded-lg transition-all duration-300 ${
                selectedPackage.id === pkg.id
                  ? "bg-gradient-to-r from-lavender-400 to-lavender-600 text-white"
                  : "bg-lavender-100 text-black hover:bg-lavender-200"
              }`}
            >
              {selectedPackage.id === pkg.id ? "Selected" : "Select"}
            </button>
          </div>
        ))}
      </div>

      <div className="white-card p-8 rounded-xl mb-12 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-black">Payment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">Coupon Code</label>
              <div className="flex">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-grow bg-lavender-50 rounded-l-lg p-3 focus:outline-none focus:ring-1 focus:ring-lavender-500 text-black border border-lavender-200"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-lavender-500 px-4 rounded-r-lg text-white"
                >
                  Apply
                </button>
              </div>
              {discount > 0 && (
                <p className="text-green-600 text-sm mt-2">
                  {discount}% discount applied!
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-black">Payment Method</label>
              <div className="flex space-x-4">
                <div className="flex-1 bg-lavender-50 p-4 rounded-lg border border-lavender-200 flex items-center space-x-3 cursor-pointer">
                  <CreditCard className="h-5 w-5 text-lavender-600" />
                  <span className="text-black">Credit Card</span>
                </div>
                <div className="flex-1 bg-lavender-50 p-4 rounded-lg border border-lavender-200 flex items-center space-x-3 cursor-pointer">
                  <Gift className="h-5 w-5 text-lavender-600" />
                  <span className="text-black">UPI</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Selected Package</span>
                <span className="text-black">{selectedPackage.tokens} Tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price</span>
                <span className="text-black">₹{selectedPackage.price / 100}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-₹{(selectedPackage.price * discount / 100 / 100).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-lavender-200 pt-4">
                <span className="font-bold text-black">Total</span>
                <span className="font-bold text-black">₹{(calculateFinalPrice() / 100).toFixed(0)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="bg-lavender-50 p-6 rounded-xl mb-6 flex-grow border border-lavender-100">
              <h3 className="text-lg font-medium mb-4 text-black">Order Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-black">{selectedPackage.tokens} Tokens</span>
                  <span className="text-black">₹{selectedPackage.price / 100}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discount}%)</span>
                    <span>-₹{(selectedPackage.price * discount / 100 / 100).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-lavender-200 pt-4 font-bold">
                  <span className="text-black">Total</span>
                  <span className="text-black">₹{(calculateFinalPrice() / 100).toFixed(0)}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full bg-gradient-to-r from-lavender-400 to-lavender-600 py-4 px-6 rounded-lg font-bold text-white flex items-center justify-center transition-all duration-300 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                "Complete Purchase"
              )}
            </button>
            
            <div className="flex items-center justify-center mt-4 text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>Processing time: Instant activation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="white-card p-6 rounded-xl flex flex-col items-center text-center shadow-md">
          <div className="h-12 w-12 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-lavender-600" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-black">Instant Activation</h3>
          <p className="text-gray-600">Tokens are added to your account immediately after purchase</p>
        </div>
        
        <div className="white-card p-6 rounded-xl flex flex-col items-center text-center shadow-md">
          <div className="h-12 w-12 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-lavender-600" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-black">Secure Transactions</h3>
          <p className="text-gray-600">All payments are processed securely through Razorpay</p>
        </div>
        
        <div className="white-card p-6 rounded-xl flex flex-col items-center text-center shadow-md">
          <div className="h-12 w-12 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
            <Star className="h-6 w-6 text-lavender-600" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-black">Premium Support</h3>
          <p className="text-gray-600">Get priority assistance with any larger token packages</p>
        </div>
      </div>

      <div className="white-card p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-black">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2 text-black">What are tokens used for?</h3>
            <p className="text-gray-600">Tokens are used to access our AI services. Each API request consumes a certain number of tokens depending on complexity.</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2 text-black">Do tokens expire?</h3>
            <p className="text-gray-600">No, your purchased tokens never expire and can be used at any time.</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2 text-black">Can I get a refund?</h3>
            <p className="text-gray-600">Tokens are non-refundable once purchased. Please contact support for special circumstances.</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2 text-black">How do I track my token usage?</h3>
            <p className="text-gray-600">You can monitor your token usage in the dashboard under the "Usage" section.</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
        .white-card {
          background: white;
          border: 1px solid rgba(200, 182, 226, 0.3);
          box-shadow: 0 4px 6px rgba(200, 182, 226, 0.1);
        }
      `}</style>
    </div>
  )
}