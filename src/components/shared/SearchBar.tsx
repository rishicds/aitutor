interface SearchBarProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
  }
  
  export default function SearchBar({ searchTerm, setSearchTerm }: SearchBarProps) {
    return (
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for a tutor"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    )
  }
  
  