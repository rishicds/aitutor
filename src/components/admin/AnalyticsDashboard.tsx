"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { Loader2, Users, BookOpen, Award, Zap, ArrowUp, ArrowDown } from "lucide-react"

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalQuestions: 0,
    totalPYQs: 0,
    totalTokensUsed: 0,
  })
  const [userGrowth, setUserGrowth] = useState<{ date: string; count: number }[]>([])
  const [topUsers, setTopUsers] = useState<{ id: string; displayName: string; questionsAnswered: number }[]>([])
  const [mostPopularSubjects, setMostPopularSubjects] = useState<{ subject: string; count: number }[]>([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch users
        const usersRef = collection(db, "users")
        const usersSnapshot = await getDocs(usersRef)
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        // Fetch PYQs
        const pyqsRef = collection(db, "pyqs")
        const pyqsSnapshot = await getDocs(pyqsRef)
        
        // Fetch PDF PYQs
        const pdfPyqsRef = collection(db, "pyqPdfs")
        const pdfPyqsSnapshot = await getDocs(pdfPyqsRef)
        
        // Calculate statistics
        const now = new Date()
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1))
        
        const activeUsers = users.filter(user => 
          user.lastLogin && new Date(user.lastLogin.seconds * 1000) > oneMonthAgo
        )
        
        // Total tokens used calculation (assuming each user document has a tokensUsed field)
        const totalTokensUsed = users.reduce((sum, user) => sum + (user.tokensUsed || 0), 0)
        
        // Set basic stats
        setStats({
          totalUsers: usersSnapshot.size,
          activeUsers: activeUsers.length,
          totalQuestions: users.reduce((sum, user) => sum + (user.questionsAnswered || 0), 0),
          totalPYQs: pyqsSnapshot.size + pdfPyqsSnapshot.size,
          totalTokensUsed,
        })
        
        // Get top users by questions answered
        const topUsersList = [...users]
          .sort((a, b) => (b.questionsAnswered || 0) - (a.questionsAnswered || 0))
          .slice(0, 5)
          .map(user => ({
            id: user.id,
            displayName: user.displayName || "Anonymous",
            questionsAnswered: user.questionsAnswered || 0
          }))
        
        setTopUsers(topUsersList)
        
        // For this demo, we'll use mock data for user growth and popular subjects
        // In a real app, you'd calculate these from actual data
        const mockUserGrowth = [
          { date: "Jan", count: 25 },
          { date: "Feb", count: 40 },
          { date: "Mar", count: 65 },
          { date: "Apr", count: 80 },
          { date: "May", count: 110 },
          { date: "Jun", count: 150 },
        ]
        
        const mockPopularSubjects = [
          { subject: "Physics", count: 245 },
          { subject: "Mathematics", count: 210 },
          { subject: "Chemistry", count: 180 },
          { subject: "Biology", count: 120 },
          { subject: "Computer Science", count: 90 },
        ]
        
        setUserGrowth(mockUserGrowth)
        setMostPopularSubjects(mockPopularSubjects)
        
      } catch (error) {
        console.error("Error fetching analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lavender-600" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-lavender-800">Analytics Overview</h2>
      
      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatsCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={<Users className="h-6 w-6" />} 
          trend={8} 
        />
        <StatsCard 
          title="Active Users" 
          value={stats.activeUsers} 
          icon={<Users className="h-6 w-6" />} 
          trend={12} 
        />
        <StatsCard 
          title="Total Questions" 
          value={stats.totalQuestions} 
          icon={<BookOpen className="h-6 w-6" />} 
          trend={23} 
        />
        <StatsCard 
          title="PYQs Available" 
          value={stats.totalPYQs} 
          icon={<Award className="h-6 w-6" />} 
          trend={5} 
        />
        <StatsCard 
          title="Tokens Used" 
          value={stats.totalTokensUsed} 
          icon={<Zap className="h-6 w-6" />} 
          trend={18} 
        />
      </div>
      
      {/* Charts and Tables */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* User Growth Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-lavender-800">User Growth</h3>
          <div className="h-64">
            <UserGrowthChart data={userGrowth} />
          </div>
        </div>
        
        {/* Popular Subjects Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-lavender-800">Popular Subjects</h3>
          <div className="h-64">
            <PopularSubjectsChart data={mostPopularSubjects} />
          </div>
        </div>
      </div>
      
      {/* Top Users Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-lavender-800">Top Users</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Questions Answered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {topUsers.map((user, index) => (
              <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{user.displayName}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.questionsAnswered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Helper components for the dashboard

interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  trend: number
}

function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="rounded-lg bg-lavender-100 p-2 text-lavender-600">{icon}</div>
        <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-sm font-medium text-gray-500">{title}</div>
    </div>
  )
}

// Simple chart components
// In a real app, you would use a library like Chart.js or Recharts

function UserGrowthChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count))
  
  return (
    <div className="flex h-full items-end justify-between">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <div 
            className="w-10 bg-lavender-500 transition-all duration-500"
            style={{ height: `${(item.count / max) * 100}%` }}
          ></div>
          <div className="mt-2 text-xs text-gray-500">{item.date}</div>
          <div className="text-xs font-medium">{item.count}</div>
        </div>
      ))}
    </div>
  )
}

function PopularSubjectsChart({ data }: { data: { subject: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count))
  
  return (
    <div className="flex h-full flex-col justify-between">
      {data.map((item, i) => (
        <div key={i} className="mb-2 flex items-center">
          <div className="w-24 truncate text-xs">{item.subject}</div>
          <div className="ml-2 flex-1">
            <div 
              className="h-6 bg-lavender-500 transition-all duration-500"
              style={{ width: `${(item.count / max) * 100}%` }}
            ></div>
          </div>
          <div className="ml-2 text-xs font-medium">{item.count}</div>
        </div>
      ))}
    </div>
  )
}
