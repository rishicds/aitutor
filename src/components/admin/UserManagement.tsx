"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { Loader2, Search, Edit, Trash2, Save, X } from "lucide-react"

interface User {
  id: string
  email: string
  displayName: string
  tokens: number
  createdAt: any
  isAdmin: boolean
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editedUserData, setEditedUserData] = useState<Partial<User>>({})

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users")
        const userSnapshot = await getDocs(usersCollection)
        const userList = userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[]
        setUsers(userList)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleEditUser = (user: User) => {
    setEditingUser(user.id)
    setEditedUserData({
      displayName: user.displayName,
      email: user.email,
      tokens: user.tokens,
      isAdmin: user.isAdmin,
    })
  }

  const handleSaveUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), editedUserData)
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, ...editedUserData } : user))
      )
      setEditingUser(null)
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "users", userId))
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lavender-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-lavender-800">Users</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-lavender-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-lavender-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                Tokens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  {editingUser === user.id ? (
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-2 py-1"
                      value={editedUserData.displayName || ""}
                      onChange={(e) =>
                        setEditedUserData({ ...editedUserData, displayName: e.target.value })
                      }
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {editingUser === user.id ? (
                    <input
                      type="email"
                      className="w-full rounded border border-gray-300 px-2 py-1"
                      value={editedUserData.email || ""}
                      onChange={(e) => setEditedUserData({ ...editedUserData, email: e.target.value })}
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{user.email}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {editingUser === user.id ? (
                    <input
                      type="number"
                      className="w-full rounded border border-gray-300 px-2 py-1"
                      value={editedUserData.tokens || 0}
                      onChange={(e) =>
                        setEditedUserData({
                          ...editedUserData,
                          tokens: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{user.tokens}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {editingUser === user.id ? (
                    <select
                      className="w-full rounded border border-gray-300 px-2 py-1"
                      value={editedUserData.isAdmin ? "admin" : "user"}
                      onChange={(e) =>
                        setEditedUserData({
                          ...editedUserData,
                          isAdmin: e.target.value === "admin",
                        })
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        user.isAdmin
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {user.createdAt?.seconds
                      ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                      : "N/A"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {editingUser === user.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveUser(user.id)}
                        className="rounded bg-lavender-600 p-1 text-white hover:bg-lavender-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="rounded bg-gray-500 p-1 text-white hover:bg-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="rounded bg-red-500 p-1 text-white hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
