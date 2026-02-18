import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Send, CheckCircle, AlertCircle, Brain, Target, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TrainingData {
  input: string;
  expectedOutput: string;
  context: string;
}

interface TrainingHistoryItem {
  id: string;
  agent: string;
  input: string;
  expectedOutput: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
  suggestions?: string;
}

export default function AIAgentTrainer() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>("vendor");
  const [isTraining, setIsTraining] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<string>("");
  
  const [trainingData, setTrainingData] = useState<TrainingData>({
    input: "",
    expectedOutput: "",
    context: ""
  });

  const agentTypes = [
    { value: "vendor", label: "Vendor Agent", description: "Vendor management and analytics" },
    { value: "booking", label: "Booking Agent", description: "Booking operations and optimization" },
    { value: "marketing", label: "Marketing Agent", description: "Content generation and campaigns" },
    { value: "support", label: "Support Agent", description: "Customer service and tickets" },
    { value: "concierge", label: "Trip Concierge", description: "Travel planning and recommendations" }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Read JSON file content
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          if (content.input && content.expectedOutput) {
            setTrainingData({
              input: content.input,
              expectedOutput: content.expectedOutput,
              context: content.context || ""
            });
            toast({
              title: "File Loaded",
              description: "Training data loaded from file successfully"
            });
          }
        } catch (error) {
          toast({
            title: "Invalid File",
            description: "Please upload a valid JSON training file",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const submitTraining = async () => {
    if (!trainingData.input || !trainingData.expectedOutput) {
      toast({
        title: "Missing Data",
        description: "Please provide both input and expected output",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    try {
      const response = await apiRequest("POST", "/api/ai/agent-trainer", {
        agent: selectedAgent,
        trainingData
      });

      const result = await response.json();

      if (result.success) {
        // Add to training history
        const newItem: TrainingHistoryItem = {
          id: result.trainingId,
          agent: selectedAgent,
          input: trainingData.input,
          expectedOutput: trainingData.expectedOutput,
          status: 'success',
          timestamp: new Date().toISOString(),
          suggestions: result.suggestions
        };

        setTrainingHistory(prev => [newItem, ...prev]);
        setSuggestions(result.suggestions);

        // Clear form
        setTrainingData({ input: "", expectedOutput: "", context: "" });
        setUploadedFile(null);

        toast({
          title: "Training Submitted",
          description: "AI agent training data processed successfully"
        });
      } else {
        throw new Error(result.error || "Training failed");
      }

    } catch (error) {
      const errorItem: TrainingHistoryItem = {
        id: Date.now().toString(),
        agent: selectedAgent,
        input: trainingData.input,
        expectedOutput: trainingData.expectedOutput,
        status: 'error',
        timestamp: new Date().toISOString()
      };

      setTrainingHistory(prev => [errorItem, ...prev]);

      toast({
        title: "Training Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  const loadTrainingHistory = async () => {
    try {
      const response = await apiRequest("GET", `/api/ai/agent-trainer/history?agent=${selectedAgent}`);
      const result = await response.json();
      
      if (result.success) {
        setTrainingHistory(result.history);
      }
    } catch (error) {
      console.error("Failed to load training history:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">AI Agent Trainer</h1>
          <p className="text-muted-foreground">Train and improve AI agent responses with custom examples</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Agent Training
            </CardTitle>
            <CardDescription>
              Provide training examples to improve agent performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Agent Selection */}
            <div>
              <Label htmlFor="agentType">Select Agent Type</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agentTypes.map(agent => (
                    <SelectItem key={agent.value} value={agent.value}>
                      <div>
                        <div className="font-medium">{agent.label}</div>
                        <div className="text-sm text-muted-foreground">{agent.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Input */}
            <div>
              <Label htmlFor="userInput">User Input / Command</Label>
              <Textarea
                id="userInput"
                value={trainingData.input}
                onChange={(e) => setTrainingData({ ...trainingData, input: e.target.value })}
                placeholder="e.g., Create a booking for 2 guests at Ella homestay from July 1-5"
                rows={4}
              />
            </div>

            {/* Expected Output */}
            <div>
              <Label htmlFor="expectedOutput">Expected Agent Response</Label>
              <Textarea
                id="expectedOutput"
                value={trainingData.expectedOutput}
                onChange={(e) => setTrainingData({ ...trainingData, expectedOutput: e.target.value })}
                placeholder="e.g., Booking created successfully with ID: BK-12345..."
                rows={4}
              />
            </div>

            {/* Context */}
            <div>
              <Label htmlFor="context">Context / Workflow (Optional)</Label>
              <Textarea
                id="context"
                value={trainingData.context}
                onChange={(e) => setTrainingData({ ...trainingData, context: e.target.value })}
                placeholder="Additional context or workflow steps..."
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div>
              <Label>Upload Training File</Label>
              <div className="flex items-center gap-4 mt-2">
                <Button variant="outline" className="relative overflow-hidden">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </Button>
                {uploadedFile && (
                  <Badge variant="secondary">{uploadedFile.name}</Badge>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={submitTraining}
              disabled={isTraining || !trainingData.input || !trainingData.expectedOutput}
              className="w-full"
            >
              {isTraining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Training Agent...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Training Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Training Results & History */}
        <div className="space-y-6">
          {/* AI Suggestions */}
          {suggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  AI Improvement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg">
                    {suggestions}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Training History</CardTitle>
              <Button variant="outline" size="sm" onClick={loadTrainingHistory}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {trainingHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No training data yet</p>
                ) : (
                  trainingHistory.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{trainingHistory.length - index}</Badge>
                          <Badge variant="secondary">{item.agent}</Badge>
                        </div>
                        {item.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : item.status === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Input:</span>
                          <p className="text-muted-foreground">{item.input}</p>
                        </div>
                        <div>
                          <span className="font-medium">Expected:</span>
                          <p className="text-muted-foreground">
                            {item.expectedOutput.length > 100 
                              ? item.expectedOutput.substring(0, 100) + "..."
                              : item.expectedOutput
                            }
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Training Tips */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Training Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Provide clear, specific examples</li>
                  <li>• Include edge cases and error scenarios</li>
                  <li>• Use consistent formatting in responses</li>
                  <li>• Add context for complex workflows</li>
                  <li>• Test with various input styles</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}