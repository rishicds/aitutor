"use client"

import { useEffect } from "react"

import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebaseConfig"
import { useRouter } from "next/navigation"
import { Hero } from "@/components/home/Hero"
import Features from "@/components/home/Features"
import HowItWorks from "@/components/home/HowItWorks"
import Pricing from "@/components/home/Pricing"
import Testimonials from "@/components/home/Testimonials"
import CallToAction from "@/components/home/CTA"

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
    <>
   <Hero/>
    <Features/>
    <HowItWorks/>
    <Pricing/>
    <Testimonials/>
    <CallToAction/>
    </>)
}