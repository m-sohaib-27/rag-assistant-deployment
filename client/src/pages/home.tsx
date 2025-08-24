import { useState } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import QueryInterface from "@/components/QueryInterface";
import QueryResults from "@/components/QueryResults";
import SystemStatus from "@/components/SystemStatus";
import ProgressIndicator from "@/components/ProgressIndicator";
import { Bot, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">RAG Support Assistant</h1>
                <p className="text-xs text-slate-500">Document-Powered AI Support</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Upload Section */}
          <div className="lg:col-span-2">
            <DocumentUpload onStepChange={setCurrentStep} />
          </div>

          {/* Query Interface */}
          <div className="lg:col-span-1">
            <QueryInterface />
          </div>
        </div>

        {/* Recent Queries & Results */}
        <QueryResults />

        {/* System Status */}
        <SystemStatus />
      </main>
    </div>
  );
}
