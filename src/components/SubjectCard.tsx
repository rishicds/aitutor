import Link from "next/link"

interface SubjectCardProps {
  subject: {
    id: string
    name: string
    icon: string
  }
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <Link href={`/subject/${subject.id}`} className="block">
      <div className="glassmorphism p-6 hover:shadow-lg transition duration-300">
        <div className="text-4xl mb-2">{subject.icon}</div>
        <h2 className="text-xl font-semibold">{subject.name}</h2>
        <p className="text-secondary-foreground mt-2">Ask questions and learn with AI</p>
      </div>
    </Link>
  )
}

