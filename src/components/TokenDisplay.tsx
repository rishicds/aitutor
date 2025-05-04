"use client"
import { Coins } from "lucide-react"
import { motion } from "framer-motion"

const TokenDisplay = ({ tokens }: { tokens: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center space-x-2 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100"
  >
    <Coins className="text-amber-500" size={24} />
    <span className="text-lg font-semibold text-gray-700">{tokens} Tokens Available</span>
  </motion.div>
)

export default TokenDisplay
