
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminAiAssistant() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSendQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", content: query }]);
    
    try {
      const response = await fetch("/api/admin/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "system", 
        content: `Error: ${error.message}` 
      }]);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={`p-3 rounded-lg ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground ml-12" 
                      : "bg-muted mr-12"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about the platform..."
              onKeyPress={(e) => e.key === "Enter" && handleSendQuery()}
            />
            <Button 
              onClick={handleSendQuery}
              disabled={loading || !query.trim()}
            >
              {loading ? "Thinking..." : "Ask"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
