"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get or create a session ID
      let sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem("sessionId", sessionId);
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/roadmap/upload-syllabus", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload syllabus");
      }

      // Redirect to the roadmap page
      router.push(`/roadmap/${data.roadmapId}`);
    } catch (err) {
      console.error("Error uploading syllabus:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload syllabus"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleButtonClick}
      >
        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">PDF (max 10MB)</p>

        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {file && (
        <div className="flex items-center justify-between p-2 border rounded-lg">
          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
            Remove
          </Button>
        </div>
      )}

      {error && (
        <div className="p-2 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Upload Syllabus"
        )}
      </Button>
    </div>
  );
}
