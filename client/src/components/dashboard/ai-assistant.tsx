import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AiAssistant() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const { toast } = useToast();

  const handleAskAi = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    try {
      // This is a simple mock response for demo purposes
      // In a real implementation, this would call the AI endpoint
      setTimeout(() => {
        const responses = [
          "Consider creating special weekend packages that bundle accommodations with island tours for increased revenue.",
          "Your booking data shows you have capacity on weekdays. Try offering midweek discounts to boost occupancy rates.",
          "Based on your recent reviews, guests love your location but mentioned limited food options. Consider partnering with local restaurants for meal delivery.",
          "Your villa listings would perform better with more high-quality photos showing sunset views and outdoor areas.",
          "Try creating Instagram Stories highlighting guest experiences at your properties for more social engagement."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setAiResponse(randomResponse);
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-30 md:w-64 w-full max-w-xs">
        <Card className="border border-neutral-200 overflow-hidden shadow-lg">
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <i className="ri-robot-line mr-2"></i>
              <h3 className="font-medium">AI Assistant</h3>
            </div>
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:text-neutral-200"
            >
              <i className={isMinimized ? "ri-add-line" : "ri-subtract-line"}></i>
            </button>
          </div>
          
          {!isMinimized && (
            <CardContent className="p-4">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-semibold">Growth Score</span>
                  <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Good</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full animate-progress" style={{ width: '75%' }}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-neutral-500">
                  <span>0</span>
                  <span>75/100</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-1">Weekly Tip</h4>
                <p className="text-xs text-neutral-700">Consider adding more photos to your villa listings. Properties with 20+ photos get 38% more bookings.</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-1">Revenue Goal</h4>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-neutral-500">
                  <span>$0</span>
                  <span>$1,200/$2,000</span>
                </div>
              </div>
              
              <div className="mt-3">
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  variant="outline" 
                  className="w-full bg-primary-50 text-primary hover:bg-primary-100 py-2 px-3 rounded-md text-sm font-medium"
                >
                  Ask AI Assistant
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask AI Assistant</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="What can I improve this week? How can I increase bookings?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            
            {aiResponse && (
              <div className="p-4 bg-neutral-50 rounded-md border border-neutral-200">
                <h4 className="text-sm font-medium mb-1">AI Suggestion:</h4>
                <p className="text-sm">{aiResponse}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleAskAi}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? "Thinking..." : "Ask AI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
