import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { FileText, MessageSquare, Home, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = "/login";
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/documents", label: "Documents", icon: FileText },
    { path: "/queries", label: "Queries", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-foreground">RAG Assistant</h1>
            <nav className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.username}
            </span>
            <ModeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}