"use client"

import { Search } from "lucide-react"

export default function SearchBar({
  searchTerm,
  setSearchTerm,
}: { searchTerm: string; setSearchTerm: (term: string) => void }) {
  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Search subjects..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full py-2 px-4 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
    </div>
  )
}
