import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/10 dark:to-purple-950/10 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="pt-12 pb-8 px-6 md:px-12 text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-primary/10">
              <span className="text-5xl font-bold text-primary">404</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Page Not Found</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button onClick={() => setLocation("/")} size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()} 
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Help section */}
          <div className="border-t pt-8 mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard">
                <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Search className="h-4 w-4" />
                  Browse Dashboard
                </button>
              </Link>
              <a 
                href="https://docs.islandloaf.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Visit Help Center
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
