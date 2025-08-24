import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  BarChart3, 
  Zap, 
  Trash2, 
  Download, 
  Settings, 
  Database,
  Bot,
  FileText
} from "lucide-react";

export default function SystemStatus() {
  // Fetch system stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getApiStatus = () => {
    // In a real app, you'd have actual health checks
    return {
      gpt: 'Online',
      vectorDb: 'Healthy', 
      parser: 'Active'
    };
  };

  const apiStatus = getApiStatus();

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* API Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">API Status</h3>
            <div className="status-indicator status-online"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">OpenAI GPT</span>
              </div>
              <Badge variant="secondary" className="text-green-600 bg-green-50">
                {apiStatus.gpt}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Vector Database</span>
              </div>
              <Badge variant="secondary" className="text-green-600 bg-green-50">
                {apiStatus.vectorDb}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Document Parser</span>
              </div>
              <Badge variant="secondary" className="text-green-600 bg-green-50">
                {apiStatus.parser}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Usage Stats</h3>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Queries Today</span>
              <span className="text-sm font-medium text-slate-900">
                {(stats as any)?.queriesToday || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Documents Indexed</span>
              <span className="text-sm font-medium text-slate-900">
                {(stats as any)?.processedDocuments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Avg Accuracy</span>
              <span className="text-sm font-medium text-slate-900">
                {(stats as any)?.avgAccuracy || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Vector Chunks</span>
              <span className="text-sm font-medium text-slate-900">
                {(stats as any)?.chunksWithEmbeddings || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <Zap className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                // TODO: Implement clear index functionality
                console.log('Clear vector index');
              }}
            >
              <Trash2 className="w-4 h-4 mr-2 text-slate-400" />
              Clear Vector Index
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                // TODO: Implement export functionality
                console.log('Export query history');
              }}
            >
              <Download className="w-4 h-4 mr-2 text-slate-400" />
              Export Query History
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                // TODO: Implement settings management
                console.log('Manage settings');
              }}
            >
              <Settings className="w-4 h-4 mr-2 text-slate-400" />
              Manage Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
