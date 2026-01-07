import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, TrendingUp, MessageSquare, MapPin, Zap, Calendar, Users, DollarSign, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AgentExecutorResponseSchema,
  BookingOptimizationResponseSchema,
  FeedbackAnalysisResponseSchema,
  TripConciergeResponseSchema,
  VendorAnalyticsResponseSchema,
  type AgentExecutorResponse,
  type BookingOptimizationResponse,
  type FeedbackAnalysisResponse,
  type TripConciergeResponse,
  type VendorAnalyticsResponse,
} from "@shared/types/ai";

export default function AIFeatures() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  type AiResults = Partial<{
    booking: BookingOptimizationResponse;
    analytics: VendorAnalyticsResponse;
    feedback: FeedbackAnalysisResponse;
    trip: TripConciergeResponse;
    agent: AgentExecutorResponse;
  }>;
  const [results, setResults] = useState<AiResults>({});
  const [aiEnabled, setAiEnabled] = useState(true); // Check if OpenAI key is configured

  // Booking Optimization State
  const [bookingData, setBookingData] = useState({
    serviceType: "accommodation",
    checkIn: "",
    checkOut: "",
    guests: 2,
    budget: 500,
    preferences: [] as string[]
  });

  // Vendor Analytics State
  const [analyticsData, setAnalyticsData] = useState({
    analysisType: "comprehensive",
    period: "monthly"
  });

  // Feedback Analysis State
  const [feedbackData, setFeedbackData] = useState({
    feedback: "",
    bookingId: "",
    customerName: "",
    serviceType: ""
  });

  // Trip Concierge State
  const [tripData, setTripData] = useState({
    arrivalDate: "",
    duration: 7,
    interests: [] as string[],
    budget: 1500,
    location: "Sri Lanka"
  });

  // Agent Executor State
  const [agentData, setAgentData] = useState({
    agent: "vendor",
    action: "analyze",
    data: {} as Record<string, unknown>
  });

  const handleBookingOptimization = async () => {
    setLoading("booking");
    try {
      const response = await apiRequest("POST", "/api/ai/optimize-booking", bookingData);
      const json: unknown = await response.json();
      const result = BookingOptimizationResponseSchema.parse(json);
      setResults(prev => ({ ...prev, booking: result }));
      toast({
        title: "Booking Optimization Complete",
        description: `Found ${result.recommendations?.length || 0} recommendations`
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "Could not generate booking recommendations",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleVendorAnalytics = async () => {
    setLoading("analytics");
    try {
      const response = await apiRequest("POST", "/api/ai/vendor-analytics", analyticsData);
      const json: unknown = await response.json();
      const result = VendorAnalyticsResponseSchema.parse(json);
      setResults(prev => ({ ...prev, analytics: result }));
      toast({
        title: "Analytics Generated",
        description: "Comprehensive vendor analysis complete"
      });
    } catch (error) {
      toast({
        title: "Analytics Failed",
        description: error instanceof Error ? error.message : "Could not generate vendor analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleFeedbackAnalysis = async () => {
    setLoading("feedback");
    try {
      const response = await apiRequest("POST", "/api/ai/analyze-feedback", feedbackData);
      const json: unknown = await response.json();
      const result = FeedbackAnalysisResponseSchema.parse(json);
      setResults(prev => ({ ...prev, feedback: result }));
      toast({
        title: "Feedback Analyzed",
        description: `Sentiment: ${result.sentiment?.classification || 'Unknown'}`
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze feedback",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleTripConcierge = async () => {
    setLoading("trip");
    try {
      const response = await apiRequest("POST", "/api/ai/trip-concierge", tripData);
      const json: unknown = await response.json();
      const result = TripConciergeResponseSchema.parse(json);
      setResults(prev => ({ ...prev, trip: result }));
      toast({
        title: "Itinerary Generated",
        description: `${tripData.duration}-day trip plan created`
      });
    } catch (error) {
      toast({
        title: "Trip Planning Failed",
        description: error instanceof Error ? error.message : "Could not generate itinerary",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleAgentExecution = async () => {
    setLoading("agent");
    try {
      const response = await apiRequest("POST", "/api/ai/agent-executor", agentData);
      const json: unknown = await response.json();
      const result = AgentExecutorResponseSchema.parse(json);
      setResults(prev => ({ ...prev, agent: result }));
      toast({
        title: "Agent Action Complete",
        description: `${agentData.agent}/${agentData.action} executed successfully`
      });
    } catch (error) {
      toast({
        title: "Agent Execution Failed",
        description: error instanceof Error ? error.message : "Could not execute agent action",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const togglePreference = (pref: string, type: 'booking' | 'trip') => {
    if (type === 'booking') {
      setBookingData(prev => ({
        ...prev,
        preferences: prev.preferences.includes(pref)
          ? prev.preferences.filter(p => p !== pref)
          : [...prev.preferences, pref]
      }));
    } else {
      setTripData(prev => ({
        ...prev,
        interests: prev.interests.includes(pref)
          ? prev.interests.filter(p => p !== pref)
          : [...prev.interests, pref]
      }));
    }
  };

  const preferenceOptions = ["beachfront", "pool", "wifi", "spa", "restaurant", "parking", "gym"];
  const interestOptions = ["culture", "nature", "beaches", "adventure", "wellness", "food", "history"];

  if (!aiEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="AI Features Dashboard"
          description="Advanced AI-powered tourism analytics and automation"
        />
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>AI Features Unavailable</AlertTitle>
          <AlertDescription>
            AI features require OpenAI API configuration. Please contact your administrator to enable these features.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Available AI Features</CardTitle>
            <CardDescription>
              Once configured, you'll have access to these powerful AI capabilities:
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Smart Booking Optimization</h3>
                <p className="text-sm text-muted-foreground">AI-powered booking recommendations and price optimization</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Brain className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Vendor Analytics</h3>
                <p className="text-sm text-muted-foreground">Comprehensive business intelligence and performance insights</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Feedback Analysis</h3>
                <p className="text-sm text-muted-foreground">Automated sentiment analysis and actionable insights from customer feedback</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Trip Concierge</h3>
                <p className="text-sm text-muted-foreground">Personalized itinerary generation and travel recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="AI Features Dashboard"
        description="Advanced AI-powered tourism analytics and automation"
      />

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-700">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>AI-Powered Features</AlertTitle>
        <AlertDescription>
          Leverage cutting-edge AI technology to optimize bookings, analyze performance, and enhance customer experiences.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="booking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="booking">
            <TrendingUp className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Smart Booking</span>
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Brain className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <MessageSquare className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="trip">
            <MapPin className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Trip AI</span>
          </TabsTrigger>
          <TabsTrigger value="agent">
            <Zap className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Agents</span>
          </TabsTrigger>
        </TabsList>

        {/* Booking Optimization */}
        <TabsContent value="booking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  AI Booking Optimization
                </CardTitle>
                <CardDescription>
                  Get intelligent recommendations for optimal booking matches based on customer preferences and availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type</Label>
                    <Select value={bookingData.serviceType} onValueChange={(value) => 
                      setBookingData(prev => ({ ...prev, serviceType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="tours">Tours</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guests">Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      value={bookingData.guests}
                      onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-in</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-out</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={bookingData.budget}
                    onChange={(e) => setBookingData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preferences</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preferenceOptions.map(pref => (
                      <Badge
                        key={pref}
                        variant={bookingData.preferences.includes(pref) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => togglePreference(pref, 'booking')}
                      >
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleBookingOptimization}
                  disabled={loading === "booking"}
                  className="w-full"
                >
                  {loading === "booking" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get AI Recommendations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Results</CardTitle>
                <CardDescription>AI-generated booking recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                {results.booking ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">Total Options Found</span>
                      <Badge variant="secondary">{results.booking.totalOptions}</Badge>
                    </div>
                    
                    {results.booking.recommendations && results.booking.recommendations.length > 0 ? (
                      results.booking.recommendations.map((rec, idx) => (
                        <Card key={idx} className="overflow-hidden">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Rank #{rec.rank ?? idx + 1}</span>
                              <Badge>{rec.matchScore ?? "N/A"}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.reasoning ?? "No details provided"}</p>
                            <div className="flex gap-2">
                              <Badge variant="outline">
                                <DollarSign className="h-3 w-3 mr-1" />
                                ${rec.calculatedPrice ?? "N/A"}
                              </Badge>
                              <Badge variant="outline">{rec.valueRating ?? "N/A"}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No recommendations available</p>
                    )}

                    {results.booking.strategy && (
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertTitle>Booking Strategy</AlertTitle>
                        <AlertDescription>{results.booking.strategy}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={<TrendingUp className="h-8 w-8" />}
                    title="No results yet"
                    description="Fill out the form and click 'Get AI Recommendations' to generate optimized booking suggestions."
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendor Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Vendor Performance Analytics
                </CardTitle>
                <CardDescription>
                  AI-powered business intelligence and actionable recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="analysisType">Analysis Type</Label>
                  <Select value={analyticsData.analysisType} onValueChange={(value) => 
                    setAnalyticsData(prev => ({ ...prev, analysisType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="financial">Financial Focus</SelectItem>
                      <SelectItem value="operational">Operational Focus</SelectItem>
                      <SelectItem value="marketing">Marketing Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Time Period</Label>
                  <Select value={analyticsData.period} onValueChange={(value) => 
                    setAnalyticsData(prev => ({ ...prev, period: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleVendorAnalytics}
                  disabled={loading === "analytics"}
                  className="w-full"
                >
                  {loading === "analytics" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Analytics
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Results</CardTitle>
                <CardDescription>AI-generated performance insights</CardDescription>
              </CardHeader>
              <CardContent>
                {results.analytics ? (
                  <div className="space-y-4">
                    {(results.analytics as any).insights && (results.analytics as any).insights.length > 0 ? (
                      (results.analytics as any).insights.map((insight: any, idx: number) => (
                        <Alert key={idx}>
                          <Brain className="h-4 w-4" />
                          <AlertTitle className="capitalize">{insight.category || "Insight"}</AlertTitle>
                          <AlertDescription>{insight.message}</AlertDescription>
                        </Alert>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No insights available</p>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Brain className="h-8 w-8" />}
                    title="No analytics yet"
                    description="Select an analysis type and generate insights to see AI-powered performance recommendations."
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feedback Analysis */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Feedback Analysis
                </CardTitle>
                <CardDescription>
                  Automated sentiment analysis and actionable insights from customer feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback">Customer Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Enter customer feedback to analyze..."
                    rows={5}
                    value={feedbackData.feedback}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookingId">Booking ID</Label>
                    <Input
                      id="bookingId"
                      placeholder="#12345"
                      value={feedbackData.bookingId}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, bookingId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="John Doe"
                      value={feedbackData.customerName}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleFeedbackAnalysis}
                  disabled={loading === "feedback" || !feedbackData.feedback}
                  className="w-full"
                >
                  {loading === "feedback" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Analyze Feedback
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>Sentiment and actionable insights</CardDescription>
              </CardHeader>
              <CardContent>
                {results.feedback ? (
                  <div className="space-y-4">
                    {results.feedback.sentiment && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Sentiment Analysis</h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              results.feedback.sentiment.classification === "positive" ? "default" :
                              results.feedback.sentiment.classification === "negative" ? "destructive" : "secondary"
                            }
                          >
                            {results.feedback.sentiment.classification}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Score: {(results.feedback.sentiment as any).score || "N/A"}
                          </span>
                        </div>
                      </div>
                    )}
                    {(results.feedback as any).actionableInsights && (results.feedback as any).actionableInsights.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Actionable Insights</h4>
                        <div className="space-y-2">
                          {(results.feedback as any).actionableInsights.map((insight: any, idx: number) => (
                            <Alert key={idx}>
                              <AlertDescription>{insight}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={<MessageSquare className="h-8 w-8" />}
                    title="No analysis yet"
                    description="Enter customer feedback and click 'Analyze Feedback' to get sentiment analysis and actionable insights."
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trip Concierge */}
        <TabsContent value="trip" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  AI Trip Concierge
                </CardTitle>
                <CardDescription>
                  Generate personalized travel itineraries and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="arrivalDate">Arrival Date</Label>
                    <Input
                      id="arrivalDate"
                      type="date"
                      value={tripData.arrivalDate}
                      onChange={(e) => setTripData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={tripData.duration}
                      onChange={(e) => setTripData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tripBudget">Total Budget ($)</Label>
                  <Input
                    id="tripBudget"
                    type="number"
                    value={tripData.budget}
                    onChange={(e) => setTripData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interestOptions.map(interest => (
                      <Badge
                        key={interest}
                        variant={tripData.interests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => togglePreference(interest, 'trip')}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleTripConcierge}
                  disabled={loading === "trip"}
                  className="w-full"
                >
                  {loading === "trip" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Itinerary...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Generate Itinerary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trip Itinerary</CardTitle>
                <CardDescription>AI-generated travel plan</CardDescription>
              </CardHeader>
              <CardContent>
                {results.trip ? (
                  <div className="space-y-4">
                    {(results.trip.itinerary as any)?.length > 0 ? (
                      (results.trip.itinerary as any).map((day: any, idx: number) => (
                        <Card key={idx}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Day {day.day}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{day.activities?.join(", ") || "No activities"}</p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No itinerary available</p>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={<MapPin className="h-8 w-8" />}
                    title="No itinerary yet"
                    description="Fill out the trip details and click 'Generate Itinerary' to create a personalized travel plan."
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Executor */}
        <TabsContent value="agent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                AI Agent Executor
              </CardTitle>
              <CardDescription>
                Execute specialized AI agent tasks for advanced automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Advanced Feature</AlertTitle>
                <AlertDescription>
                  Agent execution requires specific permissions and configuration. Contact support for more information.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
