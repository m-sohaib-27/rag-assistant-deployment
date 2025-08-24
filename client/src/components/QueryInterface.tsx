import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

export default function QueryInterface() {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();

  // Fetch example questions
  const { data: exampleQuestions = [] } = useQuery<string[]>({
    queryKey: ['/api/example-questions'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 5000,
  });

  // Submit query mutation
  const queryMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit query');
      }

      return response.json();
    },
    onSuccess: () => {
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ['/api/queries'] });
      toast({
        title: "Query submitted",
        description: "Your question is being processed...",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Query failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    queryMutation.mutate(question.trim());
  };

  const fillExampleQuestion = (exampleQuestion: string) => {
    setQuestion(exampleQuestion);
  };

  return (
    <Card className="h-fit">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Ask a Question</h2>
        
        {/* Query Input */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a support question..."
              className="resize-none pr-12"
              rows={3}
              disabled={queryMutation.isPending}
            />
            <Button
              type="submit"
              size="sm"
              className="absolute bottom-3 right-3"
              disabled={!question.trim() || queryMutation.isPending}
            >
              {queryMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Example Questions */}
        {exampleQuestions.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Example questions:</p>
            <div className="space-y-2">
              {exampleQuestions.slice(0, 3).map((example, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full text-left p-2 h-auto text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 justify-start"
                  onClick={() => fillExampleQuestion(example)}
                  disabled={queryMutation.isPending}
                >
                  "{example}"
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Query Stats */}
        {stats && (
          <div className="border-t border-slate-200 pt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-slate-900">{(stats as any).totalQueries || 0}</p>
                <p className="text-xs text-slate-500">Total Queries</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{(stats as any).avgAccuracy || 0}%</p>
                <p className="text-xs text-slate-500">Avg Accuracy</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
