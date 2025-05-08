"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Check if the file is a PDF
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }
    
    // Check file size (limit to 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.uid);
      
      // Upload the file
      const response = await fetch("/api/roadmap/upload-syllabus", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload syllabus");
      }
      
      const data = await response.json();
      
      // Redirect to the process page or show success
      router.push(`/roadmap/${data.roadmapId}`);
      router.refresh();
      
    } catch (err) {
      console.error("Error uploading syllabus:", err);
      setError(err instanceof Error ? err.message : "Failed to upload syllabus");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="syllabus">Upload Syllabus PDF</Label>
        <Input
          id="syllabus"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="cursor-pointer"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      
      <Button 
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? "Processing..." : "Upload & Generate Roadmap"}
      </Button>
      
      <p className="text-xs text-muted-foreground">
        Max file size: 5MB. Only PDF files are accepted.
      </p>
    </div>
  );
} 