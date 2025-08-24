import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, Brain, FileText } from "lucide-react";

export default function QueriesPage() {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queriesData, isLoading } = useQuery({
    queryKey: ["/api/queries"],
  });

  const { data: documentsData } = useQuery({
    queryKey: ["/api/documents"],
  });

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      return apiRequest("/api/queries", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
      setQuestion("");
      toast({
        title: "Success",
        description: "Question answered successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process question",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }
    askMutation.mutate(question.trim());
  };

  const queries = queriesData?.queries || [];
  const documents = documentsData?.documents || [];
  const completedDocuments = documents.filter((doc: any) => doc.status === "completed");

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
        <h1 className="text-3xl font-bold text-foreground">Ask Questions</h1>
        <p className="text-muted-foreground mt-2">
          Get AI-powered answers based on your uploaded documents.
        </p>
      </div>

      {/* Question Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Ask a Question</span>
          </CardTitle>
          <CardDescription>
            {completedDocuments.length > 0 
              ? `Ready to answer questions from ${completedDocuments.length} processed document${completedDocuments.length !== 1 ? 's' : ''}`
              : "Upload and process documents first to ask questions"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about your documents?"
                disabled={completedDocuments.length === 0 || askMutation.isPending}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={completedDocuments.length === 0 || askMutation.isPending || !question.trim()}
                className="flex items-center space-x-2"
              >
                {askMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{askMutation.isPending ? "Asking..." : "Ask"}</span>
              </Button>
            </div>
          </form>

          {completedDocuments.length === 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm">
                  You need to upload and process documents before asking questions.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queries History */}
      <Card>
        <CardHeader>
          <CardTitle>Question History</CardTitle>
          <CardDescription>
            {queries.length > 0 
              ? `${queries.length} question${queries.length !== 1 ? 's' : ''} asked`
              : "No questions asked yet"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queries.length > 0 ? (
            <div className="space-y-6">
              {queries.map((query: any) => (
                <div key={query.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {query.question}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(query.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-8 space-y-2">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">AI Answer</span>
                        {query.confidence && (
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(query.confidence * 100)}% confidence)
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{query.answer}</p>
                    </div>
                    
                    {query.sources && query.sources.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span>Sources: {query.sources.length} document chunk{query.sources.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No questions asked yet. Ask your first question above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}