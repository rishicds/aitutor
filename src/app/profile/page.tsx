/* eslint-disable */
"use client"
import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { User as FirebaseUser } from "firebase/auth"
import { 
  Loader2, 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Activity, 
  Award, 
  Edit3, 
  Save, 
  LogOut,
  Zap
} from 'lucide-react'
import ReactMarkdown from "react-markdown"

// Custom lavender color scheme (matching PYQ page)
const lavenderColors = {
  glassmorphism: "bg-white/80 backdrop-blur-md border border-lavender-200",
  neonGlow: "text-lavender-700 drop-shadow-[0_0_10px_rgba(150,120,230,0.7)]",
}
interface UserData {
  displayName?: string;
  email?: string;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
  bio?: string;
  education?: string;
  subjects?: string[];
  tokens?: number;
  questionsAnswered?: number;
  questionsCreated?: number;
  averageScore?: number;
}

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [tokens, setTokens] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    education: "",
    subjects: [] as string[]
  })
  const [pageLoading, setPageLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [stats, setStats] = useState({
    questionsAnswered: 0,
    questionsCreated: 0,
    subjectsStudied: 0,
    averageScore: 0
  })

  useEffect(() => {
    if (loading) return
    
    if (user) {
      fetchUserData()
    } else {
      setPageLoading(false)
    }
  }, [user, loading])

  const fetchUserData = async () => {
    if (!user) return
    
    try {
      setPageLoading(true)
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData(data)
        setFormData({
          displayName: data.displayName || user.displayName || "",
          bio: data.bio || "",
          education: data.education || "",
          subjects: data.subjects || []
        })
        setTokens(data.tokens || 10)
        
        // Fetch or calculate stats
        setStats({
          questionsAnswered: data.questionsAnswered || 0,
          questionsCreated: data.questionsCreated || 0,
          subjectsStudied: data.subjects?.length || 0,
          averageScore: data.averageScore || 0
        })
      } else {
        // Initialize user data if it doesn't exist
        setUserData({
          displayName: user.displayName || "",
          email: user.email || undefined,
          photoURL: user.photoURL || undefined,
          createdAt: new Date().toISOString(),
          tokens: 10
        })
        setFormData({
          displayName: user.displayName || "",
          bio: "",
          education: "",
          subjects: []
        })
        setTokens(10)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setPageLoading(false)
    }
  }

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubjectChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    const value = target.value
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      if (!formData.subjects.includes(value.trim())) {
        setFormData({
          ...formData,
          subjects: [...formData.subjects, value.trim()]
        })
      }
      target.value = ""
    }
  }
  
  const removeSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter(s => s !== subject)
    })
  }

  const saveProfile = async () => {
    if (!user) return
    
    try {
      setSaveLoading(true)
      const userDocRef = doc(db, "users", user.uid)
      
      const updatedData = {
        ...userData,
        displayName: formData.displayName,
        bio: formData.bio,
        education: formData.education,
        subjects: formData.subjects,
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(userDocRef, updatedData)
      setUserData(updatedData)
      setEditMode(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setSaveLoading(false)
    }
  }

  const handleLogout = () => {
    auth.signOut()
  }

  const formatDate = (dateString: string | number | Date | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(' ').map((word: string) => word[0]).join('').toUpperCase()
  }

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className={`text-4xl font-bold mb-8 ${lavenderColors.neonGlow}`}>Profile</h1>
        <div className={`${lavenderColors.glassmorphism} p-10 rounded-lg shadow-lg max-w-md mx-auto`}>
          <p className="text-lg mb-4">Please log in to view your profile.</p>
          <button 
            onClick={() => window.location.href = "/login"} 
            className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300"
          >
            Log In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`text-4xl font-bold mb-8 text-center ${lavenderColors.neonGlow}`}>Your Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg md:col-span-1`}>
          <div className="flex flex-col items-center mb-6">
            {userData?.photoURL ? (
              <img 
                src={userData.photoURL} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-lavender-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-lavender-200 flex items-center justify-center text-3xl font-bold text-lavender-700">
                {getInitials(userData?.displayName || user.displayName)}
              </div>
            )}
            
            <h2 className="text-2xl font-bold mt-4">{userData?.displayName || user.displayName || "User"}</h2>
            <p className="text-gray-600 flex items-center mt-1">
              <Mail size={16} className="mr-1" />
              {user.email}
            </p>
            <p className="text-gray-600 flex items-center mt-1">
              <Calendar size={16} className="mr-1" />
              Joined {formatDate(userData?.createdAt)}
            </p>
          </div>

          <div className="mt-4 p-4 bg-lavender-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold flex items-center">
                <Zap size={16} className="mr-2 text-yellow-500" />
                Available Tokens
              </h3>
              <span className="font-bold text-lavender-600">{tokens}</span>
            </div>
            <p className="text-sm text-gray-600">Use tokens to generate questions and get solutions.</p>
          </div>

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-300 flex items-center justify-center"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Stats Section */}
          <div className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg mb-8`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Activity size={20} className="mr-2 text-lavender-600" />
              Your Learning Stats
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-lavender-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-lavender-700">{stats.questionsAnswered}</p>
              </div>
              
              <div className="bg-lavender-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Questions Created</p>
                <p className="text-2xl font-bold text-lavender-700">{stats.questionsCreated}</p>
              </div>
              
              <div className="bg-lavender-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Subjects Studied</p>
                <p className="text-2xl font-bold text-lavender-700">{stats.subjectsStudied}</p>
              </div>
              
              <div className="bg-lavender-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-lavender-700">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <User size={20} className="mr-2 text-lavender-600" />
                Profile Information
              </h2>
              
              {!editMode ? (
                <button 
                  onClick={() => setEditMode(true)}
                  className="bg-lavender-100 text-lavender-700 px-3 py-1 rounded-lg hover:bg-lavender-200 transition duration-300 flex items-center"
                >
                  <Edit3 size={16} className="mr-1" />
                  Edit
                </button>
              ) : (
                <button 
                  onClick={saveProfile}
                  disabled={saveLoading}
                  className="bg-lavender-600 text-white px-3 py-1 rounded-lg hover:bg-lavender-700 transition duration-300 flex items-center"
                >
                  {saveLoading ? (
                    <Loader2 size={16} className="mr-1 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-1" />
                  )}
                  Save
                </button>
              )}
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Education</label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                    placeholder="Your educational background..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subjects of Interest</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.subjects.map(subject => (
                      <span key={subject} className="bg-lavender-100 text-lavender-800 px-2 py-1 rounded-md text-sm flex items-center">
                        {subject}
                        <button 
                          onClick={() => removeSubject(subject)}
                          className="ml-1 text-lavender-600 hover:text-lavender-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add subject (press Enter)"
                    onKeyDown={handleSubjectChange}
                    className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userData?.bio ? (
                  <div>
                    <h3 className="text-md font-medium mb-1">Bio</h3>
                    <ReactMarkdown className="prose max-w-none text-gray-700">
                      {userData.bio}
                    </ReactMarkdown>
                  </div>
                ) : null}
                
                {userData?.education ? (
                  <div>
                    <h3 className="text-md font-medium mb-1 flex items-center">
                      <BookOpen size={16} className="mr-1" />
                      Education
                    </h3>
                    <p className="text-gray-700">{userData.education}</p>
                  </div>
                ) : null}
                
                {formData.subjects && formData.subjects.length > 0 ? (
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <Award size={16} className="mr-1" />
                      Subjects of Interest
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.subjects.map(subject => (
                        <span key={subject} className="bg-lavender-100 text-lavender-800 px-2 py-1 rounded-md text-sm">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                {!userData?.bio && !userData?.education && (!formData.subjects || formData.subjects.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Your profile is looking a bit empty.</p>
                    <p className="mt-2">Click the Edit button to add some information about yourself!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity Section */}
          <div className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg mt-8`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Activity size={20} className="mr-2 text-lavender-600" />
              Recent Activity
            </h2>
            
            {/* This would be populated with real activity data */}
            <div className="space-y-4">
              {stats.questionsAnswered > 0 || stats.questionsCreated > 0 ? (
                <>
                  <div className="p-3 border border-lavender-100 rounded-lg">
                    <p className="text-gray-700">You answered a Mathematics question on Calculus.</p>
                    <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                  </div>
                  <div className="p-3 border border-lavender-100 rounded-lg">
                    <p className="text-gray-700">You created 3 new questions on Physics.</p>
                    <p className="text-xs text-gray-500 mt-1">5 days ago</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity to show.</p>
                  <p className="mt-2">Start answering or creating questions to see your activity here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
