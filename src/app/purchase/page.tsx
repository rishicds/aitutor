"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { Check, Sparkles, Star, Zap, ShieldCheck, Clock, Users, Award, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"

const tokenPackages = [
  {
    id: "studentBasic",
    tokens: 250,
    price: {
      monthly: 49,
      yearly: 490, // 10 months price for 12 months
    },
    color: "from-sky-400 to-sky-600",
    icon: <Zap className="h-8 w-8 mb-2 text-white" />,
    perks: [
      "AI Chat for quick doubt resolution",
      "Analyze 2 PDFs/month (up to 10MB each)",
      "Unlock 5 Core Practice Modules",
      "7-day conversation history",
      "Standard email support",
    ],
    marketingTag: "",
  },
  {
    id: "studentStandard",
    tokens: 750,
    price: {
      monthly: 159,
      yearly: 1590, // 10 months price for 12 months
    },
    color: "from-purple-500 to-purple-700",
    icon: <Star className="h-8 w-8 mb-2 text-white" />,
    perks: [
      "Full AI Chat access for in-depth learning",
      "Analyze 10 PDFs/month (up to 20MB each)",
      "Solve 15 Image-based problems/month",
      "Access All Practice Modules & PYQs",
      "Utilize Basic Smart Canvas features",
      "30-day conversation history",
      "Priority email support",
    ],
    marketingTag: "Most Popular",
  },
  {
    id: "studentPro",
    tokens: 2000,
    price: {
      monthly: 299,
      yearly: 2990, // 10 months price for 12 months
    },
    color: "from-pink-500 to-pink-700",
    icon: <Sparkles className="h-8 w-8 mb-2 text-white" />,
    perks: [
      "Engage with Voice Tutor (Beta)",
      "Solve 50 Image-based problems/month",
      "Unlimited PDF Analysis (fair use, 30MB each)",
      "Unlock Full Smart Canvas capabilities",
      "Access Interactive Learning Labs",
      "90-day conversation history",
      "24/7 priority chat support",
      "Early access to new features",
    ],
    marketingTag: "Over 30% More Tokens!",
  },
  {
    id: "studentPower",
    tokens: 5000,
    price: {
      monthly: 699,
      yearly: 6990, // 10 months price for 12 months
    },
    color: "from-indigo-600 to-indigo-800",
    icon: <ShieldCheck className="h-8 w-8 mb-2 text-white" />,
    perks: [
      "Highest priority AI processing power",
      "Significantly increased usage limits",
      "Dedicated support channel for quick help",
      "1-year extensive conversation history",
      "Access all current & future modules",
    ],
    marketingTag: "Best Value: 40% Extra Tokens!",
  },
]

export default function PurchaseTokens() {
  const [user] = useAuthState(auth)
  const [selectedPackage, setSelectedPackage] = useState(tokenPackages[1])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [currentTokens, setCurrentTokens] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

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

  const CGST_RATE = 0.09; // 9%
  const SGST_RATE = 0.09; // 9%
  const TOTAL_GST_RATE = CGST_RATE + SGST_RATE;

  const priceDetails = useMemo(() => {
    const packageListedPrice_inclusive = selectedPackage.price[billingCycle];
    const discountAmount = (packageListedPrice_inclusive * discount) / 100;
    const finalPayableAmount_inclusive = packageListedPrice_inclusive - discountAmount;

    const taxableValue = finalPayableAmount_inclusive / (1 + TOTAL_GST_RATE);
    const cgstComponent = taxableValue * CGST_RATE;
    const sgstComponent = taxableValue * SGST_RATE;

    return {
      packageListedPrice_inclusive,
      discountAmount,
      finalPayableAmount_inclusive,
      taxableValue,
      cgstComponent,
      sgstComponent,
    };
  }, [selectedPackage, billingCycle, discount, TOTAL_GST_RATE]);

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

  const handlePurchase = async () => {
    if (!user) {
      alert("Please log in to make a purchase.")
      return
    }
    setLoading(true)

    try {
      const orderPayload = {
        amount: Math.round(priceDetails.finalPayableAmount_inclusive * 100),
        currency: "INR",
        receipt: `receipt_order_${user.uid}_${Date.now()}`,
        packageId: selectedPackage.id,
        packageName: selectedPackage.id.replace("student", "") + " Plan",
        tokens: selectedPackage.tokens,
        userId: user.uid,
      }

      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json() as { error?: string }
        throw new Error(errorData.error || "Failed to create Razorpay order.")
      }

      const orderData = await orderResponse.json() as { id: string; amount: number; currency: string }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AI Tutor Platform - Tokens",
        description: `Purchase ${selectedPackage.tokens} Tokens - ${selectedPackage.id.replace("student", "")} Plan`,
        image: "/favicon.ico",
        order_id: orderData.id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verificationPayload = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.uid,
              tokensToAdd: selectedPackage.tokens,
            }
            const verificationResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(verificationPayload),
            })

            if (!verificationResponse.ok) {
              const errorData = await verificationResponse.json() as { error?: string }
              throw new Error(errorData.error || "Payment verification failed.")
            }

            const verificationData = await verificationResponse.json() as { verified: boolean }
            
            if (verificationData.verified) {
              toast.success("Payment successful! Tokens added to your account.")
              setCurrentTokens((prevTokens) => prevTokens + selectedPackage.tokens)
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 4000)

              // Generate PDF bill
              const doc = new jsPDF();
              doc.setFontSize(18);
              doc.text("BrainBoost - Payment Invoice", 20, 20);
              doc.setFontSize(12);
              doc.text(`Date: ${new Date().toLocaleString()}`, 20, 35);
              doc.text(`User: ${user.displayName || user.email || user.uid}`, 20, 45);
              doc.text(`Plan: ${selectedPackage.id.replace("student", "")} (${billingCycle})`, 20, 55);
              doc.text(`Tokens: ${selectedPackage.tokens}`, 20, 65);
              doc.text(`Amount Paid: ₹${priceDetails.finalPayableAmount_inclusive.toFixed(2)}`, 20, 75);
              doc.text(`Order ID: ${orderData.id || "-"}`, 20, 85);
              doc.text("Thank you for your purchase!", 20, 105);
              doc.save(`BrainBoost_Invoice_${Date.now()}.pdf`);
            } else {
              toast.error("Payment verification failed. Please contact support.")
            }
          } catch (verifyError) {
            const error = verifyError as Error
            console.error("Payment verification error:", error)
            toast.error(`Payment verification failed: ${error.message}`)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
          contact: user.phoneNumber || "",
        },
        notes: {
          package: selectedPackage.id,
          userId: user.uid,
        },
        theme: {
          color: "#5B21B6",
        },
      }
      
      // @ts-expect-error Razorpay is loaded from external script and attached to window
      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", function (response: { 
        error: { 
          code: string; 
          description: string; 
          reason: string; 
          step: string; 
          source?: string;
          metadata?: object;
        }
      }) {
        console.error("Razorpay payment failed:", response.error)
        toast.error(
          `Payment failed: ${response.error.description} (Reason: ${response.error.reason}, Step: ${response.error.step})`
        )
        setLoading(false)
      })
      rzp.open()

    } catch (error) {
      const err = error as Error
      console.error("Purchase error:", err)
      toast.error(`Purchase failed: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-lavender-200 text-gray-800">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: ["#C8B6E2", "#9575CD", "#7E57C2", "#B39DDB", "#D1C4E9"][Math.floor(Math.random() * 5)],
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <section className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-gray-900">
            Unlock Your <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Full Learning Potential</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect subscription plan to supercharge your studies with our advanced AI tutors and tools. Get instant help, master complex topics, and achieve your academic goals.
          </p>
          {user && (
            <div className="flex justify-center mb-8">
              <div className="bg-white px-6 py-4 flex items-center space-x-4 rounded-lg shadow-lg w-full max-w-sm border border-lavender-300">
                <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">My Token Balance</p>
                  <p className="text-2xl font-bold text-gray-800">{currentTokens} Tokens</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-lg shadow-md inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly <span className="text-xs text-green-500 ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        <section className="mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {tokenPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col border-2 ${
                  selectedPackage.id === pkg.id ? "border-purple-600 scale-105" : "border-transparent hover:border-purple-300"
                }`}
              >
                {pkg.marketingTag && (
                  <div className={`absolute top-0 -mt-3 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full shadow-md ${
                    pkg.id === "studentStandard" ? "bg-purple-600 text-white" : 
                    pkg.id === "studentPro" ? "bg-pink-600 text-white" :
                    pkg.id === "studentPower" ? "bg-green-600 text-white" :
                    "" 
                  }`}>
                    {pkg.marketingTag}
                  </div>
                )}
                
                <div className="p-6 flex-grow">
                  <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${pkg.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                    {pkg.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">{pkg.tokens} Tokens</h2>
                  <p className="text-center text-gray-500 mb-4 text-sm capitalize">{pkg.id.replace("student", "")} Plan</p>
                  
                  <div className="text-center mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">₹{pkg.price[billingCycle]}</span>
                    <span className="text-gray-500 text-sm">/{billingCycle}</span>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-green-600 mt-1">Save 20% with yearly billing</p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 text-sm text-gray-600 flex-grow">
                    {pkg.perks.map((perk, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-0">
                   <button
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 text-center ${
                      selectedPackage.id === pkg.id
                        ? `bg-gradient-to-r ${pkg.color} text-white shadow-md`
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {selectedPackage.id === pkg.id ? "Selected Plan" : "Choose Plan"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mb-12 md:mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <Users className="h-10 w-10 text-purple-600 mx-auto mb-3"/>
                    <p className="text-xl font-semibold text-gray-800">10,000+ Students</p>
                    <p className="text-sm text-gray-500">already learning with us</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <Award className="h-10 w-10 text-pink-600 mx-auto mb-3"/>
                    <p className="text-xl font-semibold text-gray-800">Top Rated AI Tools</p>
                    <p className="text-sm text-gray-500">for effective learning</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <TrendingUp className="h-10 w-10 text-sky-600 mx-auto mb-3"/>
                    <p className="text-xl font-semibold text-gray-800">Boost Your Grades</p>
                    <p className="text-sm text-gray-500">with personalized help</p>
                </div>
            </div>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl mb-12 md:mb-16 border border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 text-center">Secure Checkout</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="couponCode" className="block text-sm font-medium mb-1 text-gray-700">Have a Coupon Code?</label>
                <div className="flex">
                  <input
                    id="couponCode"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code (e.g., WELCOME10)"
                    className="flex-grow bg-gray-50 rounded-l-md p-3 border border-gray-300 focus:ring-purple-500 focus:border-purple-500 text-gray-800"
                  />
                  <button
                    onClick={applyCoupon}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-r-md text-white font-semibold"
                  >
                    Apply
                  </button>
                </div>
                {discount > 0 && <p className="text-green-600 text-sm mt-2 font-medium">{discount}% discount applied successfully!</p>}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Payment Method</h3>
                <div className="bg-gray-100 p-4 rounded-lg border-2 border-purple-500 flex items-center space-x-3">
                  {/* You can use a Razorpay logo/icon here if you have one */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-600"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> {/* Generic payment icon, replace if you have Razorpay logo */}
                  <span className="text-gray-800 font-medium">Secure Payment via Razorpay</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">All major cards, UPI, Netbanking, and Wallets supported.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Package: <span className="font-medium text-purple-700">{selectedPackage.id.replace("student", "")}</span></span>
                    <span>{selectedPackage.tokens} Tokens</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Package Price (Incl. Tax):</span>
                    <span className="font-medium">₹{priceDetails.packageListedPrice_inclusive.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <>
                      <div className="flex justify-between text-orange-600">
                        <span>Discount ({discount}%):</span>
                        <span className="font-medium">-₹{priceDetails.discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-800 font-semibold pt-1 border-t border-gray-200 mt-1">
                        <span>Final Price (Incl. Tax):</span>
                        <span className="font-medium">₹{priceDetails.finalPayableAmount_inclusive.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {/* Tax Breakdown based on Final Payable Amount (or Package Price if no discount) */}
                  <div className="pt-2 mt-2 border-t-2 border-dashed border-gray-300">
                    <p className="text-xs text-gray-500 mb-1">Price Breakdown (of Final Price):</p>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxable Value:</span>
                      <span className="font-medium">₹{priceDetails.taxableValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST ({CGST_RATE * 100}%):</span>
                      <span className="font-medium">+₹{priceDetails.cgstComponent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST ({SGST_RATE * 100}%):</span>
                      <span className="font-medium">+₹{priceDetails.sgstComponent.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between border-t-2 border-gray-300 pt-2 mt-2 text-lg font-bold text-gray-900">
                    <span>Total Amount Payable:</span>
                    <span>₹{priceDetails.finalPayableAmount_inclusive.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 py-3 px-6 rounded-lg font-bold text-white text-lg flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing Payment...
                  </>
                ) : (
                  "Complete Purchase Securely"
                )}
              </button>
              <p className="text-xs text-gray-500 mt-3 text-center flex items-center justify-center">
                <Clock className="h-3 w-3 mr-1.5" /> Instant token activation after payment.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12 md:mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Why Power Up Your Learning?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-lavender-200">
                    <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4"/>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Instant AI Assistance</h3>
                    <p className="text-gray-600 text-sm">Get doubts cleared and concepts explained 24/7 by our intelligent AI tutors.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-lavender-200">
                    <Sparkles className="h-12 w-12 text-pink-600 mx-auto mb-4"/>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Unlock Premium Tools</h3>
                    <p className="text-gray-600 text-sm">Access advanced features like PDF analysis, image solving, voice tutors, and interactive labs.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-lavender-200">
                    <ShieldCheck className="h-12 w-12 text-sky-600 mx-auto mb-4"/>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Flexible & Affordable</h3>
                    <p className="text-gray-600 text-sm">Choose a token package that fits your needs. Tokens never expire, use them anytime.</p>
                </div>
            </div>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                q: "What are tokens used for?",
                a: "Tokens are your key to accessing all our AI-powered learning services. Each feature, like AI chat, PDF analysis, or image solving, consumes a specific number of tokens based on its complexity.",
              },
              {
                q: "Do my purchased tokens expire?",
                a: "Absolutely not! Your tokens are yours to keep and use whenever you need them. There's no expiry date, offering you complete flexibility.",
              },
              {
                q: "Can I get a refund for tokens?",
                a: "Once purchased, tokens are non-refundable. We encourage you to choose a package that best suits your learning needs. If you face any issues, our support team is here to help.",
              },
              {
                q: "How can I track my token balance and usage?",
                a: "You can easily monitor your current token balance and see a history of your usage directly in your user dashboard, typically under an 'Account' or 'Usage' section.",
              },
               {
                q: "Which payment methods are accepted?",
                a: "We securely process payments via Razorpay, supporting major credit cards, debit cards, and UPI (coming soon). Your financial information is always protected.",
              }
            ].map((faq, i) => (
              <details key={i} className="group p-4 rounded-lg bg-gray-50 hover:bg-lavender-100 border border-gray-200">
                <summary className="flex justify-between items-center font-medium cursor-pointer text-gray-800 list-none">
                  <span>{faq.q}</span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-gray-600 mt-3 group-open:animate-fadeIn text-sm">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center py-8 mt-12 border-t border-gray-300">
        <p className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} BrainBoost. All rights reserved.</p>
      </footer>

      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .group-open\\:animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
