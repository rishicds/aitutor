"use client"

import { useState, useEffect, useRef } from "react"
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { Loader2, Upload, Trash2, Edit, Save, X, File, Search } from "lucide-react"

interface PyqPdf {
  id: string
  title: string
  subject: string
  year: number
  difficulty: "easy" | "medium" | "hard"
  fileUrl: string
  fileName: string
  publicId: string
  uploadedAt: string
  contentProcessed: boolean
}

export default function PdfManagement() {
  const [pdfs, setPdfs] = useState<PyqPdf[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingPdf, setEditingPdf] = useState<string | null>(null)
  const [editedPdfData, setEditedPdfData] = useState<Partial<PyqPdf>>({})
  
  // Form state for new PDF
  const [newPdf, setNewPdf] = useState({
    title: "",
    subject: "",
    year: new Date().getFullYear(),
    difficulty: "medium" as "easy" | "medium" | "hard",
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // -------- YOU NEED TO ADD YOUR CLOUDINARY DETAILS HERE --------
  const CLOUDINARY_CLOUD_NAME = "djydvffdp"; // <--- REPLACE WITH YOUR CLOUD NAME
  const CLOUDINARY_UPLOAD_PRESET = "pdfupload"; // <--- REPLACE WITH YOUR UPLOAD PRESET
  // ---------------------------------------------------------------
  
  useEffect(() => {
    fetchPdfs()
  }, [])
  
  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const pyqsCollection = collection(db, "pyqPdfs")
      const pdfSnapshot = await getDocs(pyqsCollection)
      const pdfList = pdfSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PyqPdf[]
      setPdfs(pdfList)
    } catch (error) {
      console.error("Error fetching PDFs:", error)
      alert("Failed to fetch PDFs.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf') {
        alert("Please select a PDF file")
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert("File too large. Maximum size is 10MB")
        return
      }
      setSelectedFile(file)
    }
  }
  
  const resetForm = () => {
    setNewPdf({
      title: "",
      subject: "",
      year: new Date().getFullYear(),
      difficulty: "medium",
    })
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setUploadProgress(0)
  }
  
  const handleUploadPdf = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      alert("Please select a file to upload")
      return
    }

    if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
      alert("Cloudinary cloud name is not configured.");
      return;
    }
    if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === "YOUR_UPLOAD_PRESET") {
      alert("Cloudinary upload preset is not configured.");
      return;
    }
    
    setUploading(true)
    setUploadProgress(0) // Reset progress

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    // Optional: Add tags, folder, etc.
    // formData.append("folder", "pyqs"); 

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Cloudinary upload failed");
      }

      const data = await response.json();
      
      setUploadProgress(100); // Set progress to 100 on success

      // Add entry to Firestore with Cloudinary URL and public_id
      const pdfData: Omit<PyqPdf, 'id'> = { // Omit id as Firestore generates it
        ...newPdf,
        fileUrl: data.secure_url,
        fileName: selectedFile.name, // Or data.original_filename if preferred
        publicId: data.public_id,    // Store public_id
        uploadedAt: new Date().toISOString(), // Store as ISO string
        contentProcessed: false,
      }
      
      await addDoc(collection(db, "pyqPdfs"), pdfData)
      
      resetForm()
      fetchPdfs() // Re-fetch to show the new PDF
      alert("PDF uploaded successfully to Cloudinary and record saved!");

    } catch (error) {
      console.error("Error uploading to Cloudinary or saving to Firestore:", error)
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }
  
  const handleEditPdf = (pdf: PyqPdf) => {
    setEditingPdf(pdf.id)
    setEditedPdfData({
      title: pdf.title,
      subject: pdf.subject,
      year: pdf.year,
      difficulty: pdf.difficulty,
      // fileUrl and publicId are not typically edited here
    })
  }
  
  const handleSavePdf = async (pdfId: string) => {
    try {
      // Ensure publicId and fileUrl are not accidentally overwritten with undefined
      // And also ensure other fields that are not meant to be edited here are not passed
      const dataToUpdate: Partial<Omit<PyqPdf, 'id' | 'fileUrl' | 'fileName' | 'publicId' | 'uploadedAt' | 'contentProcessed'>> = {
        title: editedPdfData.title,
        subject: editedPdfData.subject,
        year: editedPdfData.year,
        difficulty: editedPdfData.difficulty,
      };

      await updateDoc(doc(db, "pyqPdfs", pdfId), dataToUpdate)
      setPdfs((prevPdfs) =>
        prevPdfs.map((pdf) => (pdf.id === pdfId ? { ...pdf, ...dataToUpdate } : pdf))
      )
      setEditingPdf(null)
      alert("PDF details updated.")
    } catch (error) {
      console.error("Error updating PDF:", error)
      alert("Failed to update PDF. Please try again.")
    }
  }
  
  const handleDeletePdf = async (pdfId: string, publicId: string) => {
    if (!publicId) {
      alert("Cannot delete: Public ID is missing for this PDF.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this PDF? This will remove it from Cloudinary and your records.")) {
      try {
        setLoading(true); // Indicate loading state for deletion

        // Step 1: Call your backend API to delete from Cloudinary
        // YOU NEED TO IMPLEMENT THIS BACKEND API ROUTE (e.g., /api/delete-cloudinary)
        const deleteResponse = await fetch(`/api/delete-cloudinary`, { // Example API route
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_id: publicId }),
        });

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json();
          console.error("Error from /api/delete-cloudinary:", errorData);
          throw new Error(errorData.error || "Failed to delete from Cloudinary via API. Check server logs.");
        }
        
        // Step 2: Delete document from Firestore
        await deleteDoc(doc(db, "pyqPdfs", pdfId))
        
        // Step 3: Update state
        setPdfs((prevPdfs) => prevPdfs.filter((pdf) => pdf.id !== pdfId))
        alert("PDF deleted successfully from Cloudinary and records.");

      } catch (error) {
        console.error("Error deleting PDF:", error)
        alert(`Failed to delete PDF: ${error instanceof Error ? error.message : "Unknown error"}. It might still exist in Cloudinary or your records.`)
      } finally {
        setLoading(false);
      }
    }
  }
    const processContent = async (pdfId: string) => {
    const pdf = pdfs.find(p => p.id === pdfId);
    if (!pdf) {
      alert("PDF not found in local state. Please refresh.");
      return;
    }
    if (!pdf.fileUrl) {
      alert("PDF URL is missing, cannot process content.");
      return;
    }
    if (pdf.contentProcessed) {
      alert("This PDF has already been processed.");
      return;
    }

    try {
      setLoading(true); // Use a general loading or a specific processing loading state
      alert("Starting PDF processing. This may take a few moments. You will be notified upon completion.");

      const response = await fetch("/api/process-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pdfId: pdf.id, fileUrl: pdf.fileUrl, title: pdf.title }), // Send necessary data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process PDF content via API.");
      }

      const result = await response.json();

      // Update local state to reflect processing
      setPdfs((prevPdfs) =>
        prevPdfs.map((p) => (p.id === pdfId ? { ...p, contentProcessed: true } : p))
      );
      // Optionally, update Firestore from the client if the API doesn't, though API should handle it.
      // await updateDoc(doc(db, "pyqPdfs", pdfId), { contentProcessed: true, processedAt: new Date().toISOString() });

      alert(result.message || "PDF content processed successfully and is ready for chat!");

    } catch (error) {
      console.error("Error processing PDF content:", error);
      alert(`Failed to process PDF content: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredPdfs = pdfs.filter(
    (pdf) =>
      pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdf.subject.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold text-lavender-800">Upload New PYQ PDF</h2>
        <form onSubmit={handleUploadPdf} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-lavender-500 focus:outline-none"
                value={newPdf.title}
                onChange={(e) => setNewPdf({ ...newPdf, title: e.target.value })}
                required
                placeholder="e.g., JEE Main 2023 Physics"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-lavender-500 focus:outline-none"
                value={newPdf.subject}
                onChange={(e) => setNewPdf({ ...newPdf, subject: e.target.value })}
                required
                placeholder="e.g., Physics"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-lavender-500 focus:outline-none"
                value={newPdf.year}
                onChange={(e) => setNewPdf({ ...newPdf, year: parseInt(e.target.value) })}
                min={1990}
                max={new Date().getFullYear()}
                required
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Difficulty</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-lavender-500 focus:outline-none"
                value={newPdf.difficulty}
                onChange={(e) => setNewPdf({ ...newPdf, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">PDF File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-lavender-500 focus:outline-none"
                required
              />
            </div>
          </div>
          
          {selectedFile && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Selected file: <span className="font-medium">{selectedFile.name}</span> ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            </div>
          )}
          
          {uploading && (
            <div className="mb-4">
              <div className="mb-1 flex justify-between">
                <span className="text-xs font-medium text-gray-700">Uploading...</span>
                <span className="text-xs font-medium text-gray-700">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-lavender-500"
                  style={{ width: `${uploadProgress}%`, transition: 'width 0.3s ease' }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center rounded-lg bg-lavender-600 px-4 py-2 font-medium text-white hover:bg-lavender-700 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-lavender-800">Manage PYQ PDFs</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search PDFs..."
            className="rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-lavender-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredPdfs.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <File className="mb-2 h-8 w-8 text-gray-400" />
          <p className="text-gray-500">No PDFs found. Upload your first PYQ PDF.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-lavender-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-lavender-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPdfs.map((pdf) => (
                <tr key={pdf.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    {editingPdf === pdf.id ? (
                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 px-2 py-1"
                        value={editedPdfData.title || ""}
                        onChange={(e) => setEditedPdfData({ ...editedPdfData, title: e.target.value })}
                      />
                    ) : (
                      <a 
                        href={pdf.fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center text-sm font-medium text-lavender-600 hover:text-lavender-800"
                      >
                        <File className="mr-2 h-4 w-4" />
                        {pdf.title}
                      </a>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {editingPdf === pdf.id ? (
                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 px-2 py-1"
                        value={editedPdfData.subject || ""}
                        onChange={(e) => setEditedPdfData({ ...editedPdfData, subject: e.target.value })}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{pdf.subject}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {editingPdf === pdf.id ? (
                      <input
                        type="number"
                        className="w-full rounded border border-gray-300 px-2 py-1"
                        value={editedPdfData.year || 0}
                        onChange={(e) => setEditedPdfData({ ...editedPdfData, year: parseInt(e.target.value) })}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{pdf.year}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {editingPdf === pdf.id ? (
                      <select
                        className="w-full rounded border border-gray-300 px-2 py-1"
                        value={editedPdfData.difficulty || "medium"}
                        onChange={(e) =>
                          setEditedPdfData({
                            ...editedPdfData,
                            difficulty: e.target.value as "easy" | "medium" | "hard",
                          })
                        }
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          pdf.difficulty === "easy"
                            ? "bg-green-100 text-green-800"
                            : pdf.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {pdf.difficulty}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {pdf.uploadedAt
                        ? new Date(pdf.uploadedAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        pdf.contentProcessed
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {pdf.contentProcessed ? "Processed" : "Not Processed"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {editingPdf === pdf.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSavePdf(pdf.id)}
                          className="rounded bg-lavender-600 p-1 text-white hover:bg-lavender-700"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingPdf(null)}
                          className="rounded bg-gray-500 p-1 text-white hover:bg-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPdf(pdf)}
                          className="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePdf(pdf.id, pdf.publicId)}
                          className="rounded bg-red-500 p-1 text-white hover:bg-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {!pdf.contentProcessed && (
                          <button
                            onClick={() => processContent(pdf.id)}
                            className="rounded bg-green-500 p-1 text-white hover:bg-green-600"
                            title="Process Content"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
