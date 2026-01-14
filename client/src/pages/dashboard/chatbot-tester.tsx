
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChatbotTester() {
  const [query, setQuery] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [language, setLanguage] = useState("en");
  const [response, setResponse] = useState("");

  const handleTest = async () => {
    try {
      const result = await fetch("/api/chatbot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, checkIn, checkOut, language }),
      });
      const data = await result.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error: unknown) {
      setResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chatbot API Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label>Query</label>
            <Input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter chatbot query"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label>Check-in Date</label>
              <Input 
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label>Check-out Date</label>
              <Input 
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label>Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="si">Sinhala</SelectItem>
                <SelectItem value="ta">Tamil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleTest}>Test API</Button>

          <div className="space-y-2">
            <label>Response</label>
            <Textarea 
              value={response}
              readOnly
              className="h-48 font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
