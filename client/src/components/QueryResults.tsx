import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Bot, ThumbsUp, ThumbsDown, File, FileText, FileSpreadsheet } from "lucide-react";
import type { Query } from "@shared/schema";

export default function QueryResults() {
  // Fetch recent queries
  const { data: queries = [], isLoading } = useQuery<Query[]>({
    queryKey: ['/api/queries'],
    refetchInterval: 3000, // Poll every 3 seconds for updates
  });

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const queryDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - queryDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return <File className="w-3 h-3 text-red-500" />;
      case 'csv': return <FileSpreadsheet className="w-3 h-3 text-green-500" />;
      case 'txt': return <FileText className="w-3 h-3 text-blue-500" />;
      default: return <File className="w-3 h-3 text-gray-500" />;
    }
  };

  const renderSources = (sources: any) => {
    if (!sources || !Array.isArray(sources)) return null;
    
    return (
      <div className="mt-4 pt-3 border-t border-slate-200">
        <p className="text-xs font-medium text-slate-600 mb-2">Sources:</p>
        <div className="flex flex-wrap gap-2">
          {sources.map((source: any, index: number) => (
            <div key={index} className="source-citation">
              {getFileIcon(source.documentName)}
              <span>{source.documentName}</span>
              <span className="text-blue-600">
                {source.metadata?.possibleHeader ? source.metadata.possibleHeader : `rel: ${Math.round(source.relevance * 100)}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Recent Queries</h2>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Recent Queries</h2>
            </div>
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No queries yet. Ask your first question!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Recent Queries</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
            </Button>
          </div>

          <div className="space-y-6">
            {queries.slice(0, 5).map((query) => (
              <div key={query.id} className="border border-slate-200 rounded-lg p-4">
                {/* User Question */}
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">"{query.question}"</p>
                    <p className="text-xs text-slate-500 mt-1">{formatTimeAgo(query.createdAt)}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {query.status === 'processing' ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    {query.status === 'processing' ? (
                      <div className="query-bubble">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm text-slate-500">AI is thinking...</span>
                        </div>
                      </div>
                    ) : query.status === 'error' ? (
                      <div className="query-bubble">
                        <p className="text-sm text-red-600">
                          Sorry, I encountered an error processing your question: {query.errorMessage}
                        </p>
                      </div>
                    ) : query.answer ? (
                      <div className="query-bubble">
                        <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {query.answer}
                        </div>
                        
                        {/* Source Citations */}
                        {renderSources(query.sources)}

                        {/* Feedback and Confidence */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                              <ThumbsUp className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </div>
                          {query.confidence && (
                            <span className="text-xs text-slate-500">
                              Confidence: {Math.round(query.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
