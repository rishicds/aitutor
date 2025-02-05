interface TokenDisplayProps {
    tokens: number
  }
  
  export default function TokenDisplay({ tokens }: TokenDisplayProps) {
    return (
      <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">
        <span className="font-semibold">Tokens:</span> {tokens}
      </div>
    )
  }
  
  