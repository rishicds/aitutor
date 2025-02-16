import React from 'react';
import TokenDisplay from '../TokenDisplay';
import { ArrowLeft, Bot } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
  id: string;
  tokens: number;
}

export function ChatHeader({ id, tokens }: ChatHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-lg">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <motion.div
              whileHover={{ x: -5 }}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={20} className="text-white/70" />
            </motion.div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">
              {id.charAt(0).toUpperCase() + id.slice(1)} AI Tutor
            </h1>
          </div>
        </div>
        <TokenDisplay tokens={tokens} />
      </div>
    </header>
  );
}