"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserManagement from "@/components/admin/UserManagement"
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard"
import PdfManagement from "@/components/admin/PdfManagement"
import { Loader2 } from "lucide-react"
import { getAllUsers, updateUserRole, deleteUser } from "@/actions/admin-actions"; // Assuming you have this action
import { User } from "@prisma/client"; // Assuming you have this type
import { FiTrash2, FiEdit } from "react-icons/fi"; // Example icons

// Define a type for the user data if not already defined
interface AdminPageUser extends User {
  // Add any additional properties if needed
}

export default function AdminDashboard() {
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [users, setUsers] = useState<AdminPageUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminPageUser | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push("/admin")
        return
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists() && userDoc.data().isAdmin) {
          // setIsAdmin(true)
        } else {
          router.push("/admin")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/admin")
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lavender-600" />
        <span className="ml-2 text-xl font-medium">Loading admin dashboard...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-3xl font-bold text-lavender-800">Admin Dashboard</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pdfs">PYQ Management</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
        <TabsContent value="pdfs">
          <PdfManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
