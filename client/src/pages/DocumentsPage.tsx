import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Clock, CheckCircle, XCircle, Download } from "lucide-react";

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/documents", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate(file);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const documents = documentsData?.documents || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Processed";
      case "processing":
        return "Processing";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload documents to create a knowledge base for AI-powered Q&A.
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop files or click to browse. Supports PDF, CSV, and TXT files (max 10MB).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">Drop the files here...</p>
            ) : (
              <>
                <p className="text-lg font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, CSV, TXT files up to 10MB
                </p>
              </>
            )}
          </div>
          
          {uploadMutation.isPending && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            {documents.length > 0 
              ? `${documents.length} document${documents.length !== 1 ? 's' : ''} in your knowledge base`
              : "No documents uploaded yet"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((document: any) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">{document.originalName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
                        <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(document.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(document.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No documents uploaded yet. Upload your first document to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}