import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Upload, Brain } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: documentsData } = useQuery({
    queryKey: ["/api/documents"],
    retry: false,
  });

  const { data: queriesData } = useQuery({
    queryKey: ["/api/queries"], 
    retry: false,
  });

  const documents = documentsData?.documents || [];
  const queries = queriesData?.queries || [];

  const completedDocuments = documents.filter((doc: any) => doc.status === "completed");
  const recentQueries = queries.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your RAG Support Assistant. Upload documents and ask questions to get AI-powered answers.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedDocuments.length} processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queries.length}</div>
            <p className="text-xs text-muted-foreground">
              AI-powered answers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ask</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedDocuments.length > 0 ? "Yes" : "No"}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedDocuments.length > 0 
                ? "Documents ready for Q&A" 
                : "Upload documents first"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with document analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/documents">
              <Button className="w-full flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Documents</span>
              </Button>
            </Link>
            
            <Link href="/queries">
              <Button 
                variant="outline" 
                className="w-full flex items-center space-x-2"
                disabled={completedDocuments.length === 0}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Ask Questions</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest queries and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentQueries.length > 0 ? (
              <div className="space-y-3">
                {recentQueries.map((query: any) => (
                  <div key={query.id} className="border-l-2 border-primary pl-3">
                    <p className="text-sm font-medium line-clamp-2">
                      {query.question}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(query.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                <Link href="/queries">
                  <Button variant="link" className="p-0 h-auto">
                    View all queries →
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No queries yet. Upload documents and start asking questions!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}