"use client"
import { useState, useEffect } from "react"
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebaseConfig"
import { useRouter } from "next/navigation"
import type React from "react"
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle } from "lucide-react"

export default function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [formValid, setFormValid] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const router = useRouter()
  const googleProvider = new GoogleAuthProvider()

  // Validate form
  useEffect(() => {
    setFormValid(email.includes("@") && email.includes(".") && password.length >= 6)
  }, [email, password])

  // Handle success after authentication
  const handleAuthSuccess = async () => {
    setShowSuccessMessage(true)

    // Delay redirect for animation
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  // Handle email/password sign up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: displayName || "",
        photoURL: user.photoURL || null,
        tokens: 100,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: "user",
        active: true,
      })

      await handleAuthSuccess()
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Firebase: Error (auth/email-already-in-use).":
            setError("Email already in use")
            break
          case "Firebase: Password should be at least 6 characters (auth/weak-password).":
            setError("Password should be at least 6 characters")
            break
          default:
            setError("Failed to create an account")
        }
        console.error(error)
      }
    } finally {
      if (!showSuccessMessage) {
        setLoading(false)
      }
    }
  }

  // Handle Google sign up
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError("")

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Get Google access token
      // const credential = GoogleAuthProvider.credentialFromResult(result)
      // const token = credential?.accessToken

      // Check if user already exists
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          tokens: 100,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          role: "user",
          active: true,
          authProvider: "google",
        })
      } else {
        // Update login timestamp for existing user
        await setDoc(
          userRef,
          {
            lastLogin: serverTimestamp(),
          },
          { merge: true },
        )
      }

      await handleAuthSuccess()
    } catch (error) {
      if (error instanceof Error) {
        console.error("Google sign-up error:", error)
        setError("Failed to sign up with Google")
      }
    } finally {
      if (!showSuccessMessage) {
        setGoogleLoading(false)
      }
    }
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-br from-purple-50 via-white to-purple-100 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full opacity-30 transform translate-x-1/3 -translate-y-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-200 rounded-full opacity-30 transform -translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-purple-300 rounded-full opacity-20 blur-2xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card with light effects */}
        <div
          className={`p-8 space-y-6 bg-white/80 backdrop-blur-md rounded-xl shadow-xl border border-purple-100 transition-all duration-500 
          ${showSuccessMessage ? "scale-105 border-green-200 shadow-green-100" : ""}`}
        >
          {/* Top glow effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 via-purple-500 to-purple-300 rounded-t-xl" />

          <div className="text-center relative">
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-purple-600 p-4 rounded-full shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-purple-800 mt-6">Create Account</h1>
            <p className="mt-2 text-sm text-purple-600">Sign up to get started</p>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 animate-pulse">
              <p className="text-green-600 text-center font-medium flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Account created successfully! Redirecting...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 animate-shake">
              <p className="text-red-600 text-center flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-6">
            <div className="rounded-md space-y-4">
              <div
                className={`relative transition-all duration-300 ${activeField === "displayName" ? "transform scale-105" : ""}`}
              >
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User
                    className={`h-5 w-5 transition-colors duration-300 ${activeField === "displayName" ? "text-purple-600" : "text-purple-400"}`}
                  />
                </div>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onFocus={() => setActiveField("displayName")}
                  onBlur={() => setActiveField(null)}
                  className="appearance-none w-full pl-10 pr-3 py-3 rounded-lg border border-purple-200 placeholder-purple-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  placeholder="Display Name (Optional)"
                />
              </div>

              <div
                className={`relative transition-all duration-300 ${activeField === "email" ? "transform scale-105" : ""}`}
              >
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail
                    className={`h-5 w-5 transition-colors duration-300 ${activeField === "email" ? "text-purple-600" : "text-purple-400"}`}
                  />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setActiveField("email")}
                  onBlur={() => setActiveField(null)}
                  required
                  className="appearance-none w-full pl-10 pr-3 py-3 rounded-lg border border-purple-200 placeholder-purple-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  placeholder="Email address"
                />
                {email && email.includes("@") && email.includes(".") && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              <div
                className={`relative transition-all duration-300 ${activeField === "password" ? "transform scale-105" : ""}`}
              >
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock
                    className={`h-5 w-5 transition-colors duration-300 ${activeField === "password" ? "text-purple-600" : "text-purple-400"}`}
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setActiveField("password")}
                  onBlur={() => setActiveField(null)}
                  required
                  className="appearance-none w-full pl-10 pr-10 py-3 rounded-lg border border-purple-200 placeholder-purple-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  placeholder="Password (min. 6 characters)"
                />
                <div
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-purple-400 hover:text-purple-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-purple-400 hover:text-purple-600 transition-colors" />
                  )}
                </div>
                {password && password.length >= 6 && (
                  <div className="absolute inset-y-0 right-10 flex items-center pr-3">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={handleEmailSignUp}
                disabled={loading || !formValid}
                className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all ${formValid ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-400 cursor-not-allowed"}`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Sign up
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 text-center">
            <p className="text-sm text-purple-600">
              Already have an account?{" "}
              <a
                href="/signin"
                className="font-medium text-purple-800 hover:text-purple-900 cursor-pointer hover:underline transition-all"
              >
                Sign in
              </a>
            </p>
          </div>

          {/* Social login options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-purple-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                className="py-3 px-6 border border-purple-200 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleGoogleSignUp}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card reflection effect */}
        <div className="absolute -bottom-4 left-4 right-4 h-8 bg-purple-100/30 backdrop-blur-sm rounded-bl-lg rounded-br-lg transform skew-x-6 z-0 blur-sm" />
      </div>

      {/* Animated stars/sparkles (subtle) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-300 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.4,
              animationDuration: `${1 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Hidden keyframe animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
