import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FileText, FileSpreadsheet, File, Trash2, CheckCircle, Clock, AlertCircle, Database } from "lucide-react";
import type { Document } from "@shared/schema";

interface DocumentUploadProps {
  onStepChange: (step: number) => void;
}

export default function DocumentUpload({ onStepChange }: DocumentUploadProps) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    refetchInterval: 2000, // Poll every 2 seconds to check processing status
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 5000,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Upload successful",
        description: "Your document is being processed...",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: (data, error, file) => {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.name);
        return newSet;
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/documents/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Document deleted",
        description: "The document has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",  
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      // Validate file type
      const validTypes = ['pdf', 'csv', 'txt'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !validTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: `Only PDF, CSV, and TXT files are supported. Got: ${fileExtension}`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }

      setUploadingFiles(prev => new Set(prev).add(file.name));
      uploadMutation.mutate(file);
    });
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  // Update step based on document status
  const processedDocs = documents.filter(doc => doc.status === 'processed');
  const hasProcessedDocs = processedDocs.length > 0;
  
  useEffect(() => {
    if (hasProcessedDocs && onStepChange) {
      onStepChange(3);
    } else if (documents.length > 0 && onStepChange) {
      onStepChange(2);
    }
  }, [hasProcessedDocs, documents.length, onStepChange]);

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <File className="w-4 h-4 text-red-500" />;
      case 'csv': return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case 'txt': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, errorMessage?: string | null) => {
    switch (status) {
      case 'processed':
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Processed</span>;
      case 'processing':
        return (
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-amber-600">Processing...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600" title={errorMessage || 'Processing failed'}>
              Error
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600">Uploading...</span>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Document Upload</h2>
          <span className="text-sm text-slate-500">PDF, CSV, TXT supported</span>
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors upload-area ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mb-4">
            <CloudUpload className="w-12 h-12 text-slate-400 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {isDragActive ? 'Drop your files here' : 'Drop your documents here'}
          </h3>
          <p className="text-slate-600 mb-4">or click to browse files</p>
          <Button type="button" disabled={uploadMutation.isPending}>
            Select Files
          </Button>
          <p className="text-xs text-slate-500 mt-3">Maximum file size: 10MB per file</p>
        </div>

        {/* Uploaded Files List */}
        {(documents.length > 0 || uploadingFiles.size > 0) && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-900 mb-3">
              Documents ({documents.length + uploadingFiles.size})
            </h3>
            <div className="space-y-3">
              {/* Currently uploading files */}
              {Array.from(uploadingFiles).map(fileName => (
                <div key={fileName} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{fileName}</p>
                      <p className="text-xs text-slate-500">Uploading...</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
              ))}
              
              <></> {/* Uploaded Files List */}
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.type)}
                    <div>
                      <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                      <p className="text-xs text-slate-500">
                        {(doc.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(doc.status, doc.errorMessage)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Stats */}
        {stats && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Vector Database Status</span>
              </div>
              <span className="text-sm text-blue-700">
                {(stats as any).chunksWithEmbeddings || 0} / {(stats as any).totalChunks || 0} chunks indexed
              </span>
            </div>
            <Progress value={(stats as any).indexingProgress || 0} className="mb-2" />
            <p className="text-xs text-blue-700">
              {(stats as any).indexingProgress === 100 ? 'Ready for queries' : 'Processing documents...'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
