import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, MessageSquare, MapPin, Zap, Calendar, Users, DollarSign } from "lucide-react";
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
        description: "Could not generate booking recommendations",
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
        description: "Could not generate vendor analytics",
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
        description: "Could not analyze feedback",
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
        description: "Could not generate itinerary",
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
        description: "Could not execute agent action",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">AI Features Dashboard</h1>
          <p className="text-muted-foreground">Advanced AI-powered tourism analytics and automation</p>
        </div>
      </div>

      <Tabs defaultValue="booking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="booking">Smart Booking</TabsTrigger>
          <TabsTrigger value="analytics">Vendor Analytics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Analysis</TabsTrigger>
          <TabsTrigger value="trip">Trip Concierge</TabsTrigger>
          <TabsTrigger value="agent">Agent Executor</TabsTrigger>
        </TabsList>

        {/* Booking Optimization */}
        <TabsContent value="booking">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Booking Optimization
                </CardTitle>
                <CardDescription>
                  Get intelligent recommendations for optimal booking matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  <div>
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
                  <div>
                    <Label htmlFor="checkIn">Check-in</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOut">Check-out</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={bookingData.budget}
                    onChange={(e) => setBookingData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                  />
                </div>

                <div>
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
                  {loading === "booking" ? "Analyzing..." : "Get AI Recommendations"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Results</CardTitle>
              </CardHeader>
              <CardContent>
                {results.booking ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Options Found:</span>
                      <Badge>{results.booking.totalOptions}</Badge>
                    </div>
                    
                    {results.booking.recommendations?.map((rec, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Rank #{rec.rank ?? idx + 1}</span>
                          <Badge variant="secondary">{rec.matchScore ?? "N/A"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.reasoning ?? "No details provided"}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${rec.calculatedPrice ?? "N/A"}
                          </Badge>
                          <Badge variant="outline">{rec.valueRating ?? "N/A"}</Badge>
                        </div>
                      </div>
                    )) || <p className="text-muted-foreground">No recommendations available</p>}

                    {results.booking.strategy && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium mb-2">Booking Strategy</h4>
                        <p className="text-sm">{results.booking.strategy}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Run optimization to see results</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendor Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Vendor Performance Analytics
                </CardTitle>
                <CardDescription>
                  AI-powered business intelligence and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
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

                <div>
                  <Label htmlFor="period">Analysis Period</Label>
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
                  {loading === "analytics" ? "Analyzing..." : "Generate Analytics"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Results</CardTitle>
              </CardHeader>
              <CardContent>
                {results.analytics ? (
                  <div className="space-y-4">
                    {/* Calculated Metrics */}
                    {results.analytics.calculatedMetrics && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            ${results.analytics.calculatedMetrics.totalRevenue}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {results.analytics.calculatedMetrics.conversionRate}%
                          </div>
                          <div className="text-sm text-muted-foreground">Conversion Rate</div>
                        </div>
                      </div>
                    )}

                    {/* Business Health */}
                    {results.analytics.businessHealth && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Business Health (SWOT)</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 bg-green-50 rounded">
                            <h5 className="text-sm font-medium text-green-800">Strengths</h5>
                            <ul className="text-xs text-green-700 list-disc list-inside">
                              {results.analytics.businessHealth.strengths?.slice(0, 2).map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="p-2 bg-blue-50 rounded">
                            <h5 className="text-sm font-medium text-blue-800">Opportunities</h5>
                            <ul className="text-xs text-blue-700 list-disc list-inside">
                              {results.analytics.businessHealth.opportunities?.slice(0, 2).map((o: string, i: number) => (
                                <li key={i}>{o}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Plan */}
                    {results.analytics.actionPlan && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Immediate Actions</h4>
                        {results.analytics.actionPlan.immediate?.slice(0, 3).map((action: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Generate analytics to see results</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feedback Analysis */}
        <TabsContent value="feedback">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Customer Feedback Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered sentiment analysis and business insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="feedback">Customer Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Enter customer feedback to analyze..."
                    value={feedbackData.feedback}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name (Optional)</Label>
                    <Input
                      id="customerName"
                      value={feedbackData.customerName}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedbackServiceType">Service Type</Label>
                    <Select value={feedbackData.serviceType} onValueChange={(value) => 
                      setFeedbackData(prev => ({ ...prev, serviceType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="tours">Tours</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bookingId">Booking ID (Optional)</Label>
                  <Input
                    id="bookingId"
                    value={feedbackData.bookingId}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, bookingId: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleFeedbackAnalysis}
                  disabled={loading === "feedback" || !feedbackData.feedback}
                  className="w-full"
                >
                  {loading === "feedback" ? "Analyzing..." : "Analyze Feedback"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {results.feedback ? (
                  <div className="space-y-4">
                    {/* Sentiment */}
                    {results.feedback.sentiment && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Sentiment Analysis</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            results.feedback.sentiment.classification === 'positive' ? 'default' :
                            results.feedback.sentiment.classification === 'negative' ? 'destructive' : 'secondary'
                          }>
                            {results.feedback.sentiment.classification}
                          </Badge>
                          <span className="text-sm">{results.feedback.sentiment.confidence} confidence</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{results.feedback.sentiment.emotionalTone}</p>
                      </div>
                    )}

                    {/* Business Impact */}
                    {results.feedback.businessImpact && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Business Impact</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">Priority: {results.feedback.businessImpact.priority}</Badge>
                          <Badge variant="outline">Risk: {results.feedback.businessImpact.reputationRisk}</Badge>
                        </div>
                        <p className="text-sm">{results.feedback.businessImpact.potentialImpact}</p>
                      </div>
                    )}

                    {/* Key Points */}
                    {results.feedback.insights?.keyPoints && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Key Points</h4>
                        <ul className="text-sm space-y-1">
                          {results.feedback.insights.keyPoints.slice(0, 3).map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {results.feedback.recommendations?.immediateActions && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Immediate Actions</h4>
                        <ul className="text-sm space-y-1">
                          {results.feedback.recommendations.immediateActions.slice(0, 2).map((action: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Analyze feedback to see results</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trip Concierge */}
        <TabsContent value="trip">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  AI Trip Concierge
                </CardTitle>
                <CardDescription>
                  Generate personalized Sri Lankan travel itineraries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="arrivalDate">Arrival Date</Label>
                    <Input
                      id="arrivalDate"
                      type="date"
                      value={tripData.arrivalDate}
                      onChange={(e) => setTripData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={tripData.duration}
                      onChange={(e) => setTripData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tripBudget">Total Budget ($)</Label>
                  <Input
                    id="tripBudget"
                    type="number"
                    value={tripData.budget}
                    onChange={(e) => setTripData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                  />
                </div>

                <div>
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
                  disabled={loading === "trip" || !tripData.arrivalDate}
                  className="w-full"
                >
                  {loading === "trip" ? "Planning..." : "Generate Itinerary"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trip Itinerary</CardTitle>
              </CardHeader>
              <CardContent>
                {results.trip ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    {results.trip.summary && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            ${results.trip.summary.totalEstimatedCost}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Cost</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            ${results.trip.summary.budgetRemaining}
                          </div>
                          <div className="text-sm text-muted-foreground">Budget Remaining</div>
                        </div>
                      </div>
                    )}

                    {/* Days Preview */}
                    {results.trip.itinerary?.days && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Itinerary Preview</h4>
                        {results.trip.itinerary.days.slice(0, 3).map((day: any, i: number) => (
                          <div key={i} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Day {day.day}</span>
                              <Badge variant="outline">${day.dailyTotal}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{day.location}</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Morning:</span>
                                <p>{day.morning?.activity}</p>
                              </div>
                              <div>
                                <span className="font-medium">Afternoon:</span>
                                <p>{day.afternoon?.activity}</p>
                              </div>
                              <div>
                                <span className="font-medium">Evening:</span>
                                <p>{day.evening?.activity}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {results.trip.itinerary.days.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            + {results.trip.itinerary.days.length - 3} more days...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    {results.trip.recommendations && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Top Recommendations</h4>
                        {results.trip.recommendations.mustDoActivities?.slice(0, 3).map((activity: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                            <span>{activity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Generate itinerary to see results</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Executor */}
        <TabsContent value="agent">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Agent Executor
                </CardTitle>
                <CardDescription>
                  Multi-agent automation system for business operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="agent">Agent Type</Label>
                  <Select value={agentData.agent} onValueChange={(value) => 
                    setAgentData(prev => ({ ...prev, agent: value, action: "", data: {} }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Vendor Agent</SelectItem>
                      <SelectItem value="booking">Booking Agent</SelectItem>
                      <SelectItem value="marketing">Marketing Agent</SelectItem>
                      <SelectItem value="support">Support Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select value={agentData.action} onValueChange={(value) => 
                    setAgentData(prev => ({ ...prev, action: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {agentData.agent === "vendor" && (
                        <>
                          <SelectItem value="analyze">Analyze Performance</SelectItem>
                          <SelectItem value="approve">Approve Vendor</SelectItem>
                          <SelectItem value="suspend">Suspend Vendor</SelectItem>
                        </>
                      )}
                      {agentData.agent === "booking" && (
                        <>
                          <SelectItem value="create">Create Booking</SelectItem>
                          <SelectItem value="confirm">Confirm Booking</SelectItem>
                          <SelectItem value="cancel">Cancel Booking</SelectItem>
                        </>
                      )}
                      {agentData.agent === "marketing" && (
                        <>
                          <SelectItem value="generateContent">Generate Content</SelectItem>
                          <SelectItem value="scheduleCampaign">Schedule Campaign</SelectItem>
                        </>
                      )}
                      {agentData.agent === "support" && (
                        <>
                          <SelectItem value="createTicket">Create Ticket</SelectItem>
                          <SelectItem value="respondToTicket">Respond to Ticket</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic form fields based on agent/action */}
                {agentData.agent === "vendor" && agentData.action === "approve" && (
                  <div>
                    <Label htmlFor="vendorId">Vendor ID</Label>
                    <Input
                      id="vendorId"
                      placeholder="Enter vendor ID"
                      onChange={(e) => setAgentData(prev => ({ 
                        ...prev, 
                        data: { ...prev.data, vendorId: e.target.value }
                      }))}
                    />
                  </div>
                )}

                {agentData.agent === "marketing" && agentData.action === "generateContent" && (
                  <>
                    <div>
                      <Label htmlFor="contentType">Content Type</Label>
                      <Select onValueChange={(value) => 
                        setAgentData(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, type: value }
                        }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="social-media">Social Media Post</SelectItem>
                          <SelectItem value="blog">Blog Article</SelectItem>
                          <SelectItem value="email">Email Campaign</SelectItem>
                          <SelectItem value="advertisement">Advertisement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        placeholder="Enter business name"
                        onChange={(e) => setAgentData(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, businessName: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="audience">Target Audience</Label>
                      <Input
                        id="audience"
                        placeholder="e.g., young travelers, families"
                        onChange={(e) => setAgentData(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, audience: e.target.value }
                        }))}
                      />
                    </div>
                  </>
                )}

                {agentData.agent === "support" && agentData.action === "createTicket" && (
                  <>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Enter ticket subject"
                        onChange={(e) => setAgentData(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, subject: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the issue"
                        onChange={(e) => setAgentData(prev => ({ 
                          ...prev, 
                          data: { ...prev.data, description: e.target.value }
                        }))}
                      />
                    </div>
                  </>
                )}

                <Button
                  onClick={handleAgentExecution}
                  disabled={loading === "agent" || !agentData.action}
                  className="w-full"
                >
                  {loading === "agent" ? "Executing..." : "Execute Agent Action"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Execution Results</CardTitle>
              </CardHeader>
              <CardContent>
                {results.agent ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Agent:</span>
                      <Badge>{results.agent.agent}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Action:</span>
                      <Badge variant="outline">{results.agent.action}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={results.agent.result?.success ? "default" : "destructive"}>
                        {results.agent.result?.success ? "Success" : "Failed"}
                      </Badge>
                    </div>

                    {results.agent.result?.message && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm">{results.agent.result.message}</p>
                      </div>
                    )}

                    {results.agent.result?.content && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Generated Content</h4>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{results.agent.result.content}</p>
                        </div>
                      </div>
                    )}

                    {results.agent.result?.analytics && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Analytics Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Services:</span>
                            <span className="ml-2">{results.agent.result.analytics.totalServices}</span>
                          </div>
                          <div>
                            <span className="font-medium">Bookings:</span>
                            <span className="ml-2">{results.agent.result.analytics.totalBookings}</span>
                          </div>
                          <div>
                            <span className="font-medium">Revenue:</span>
                            <span className="ml-2">${results.agent.result.analytics.revenue}</span>
                          </div>
                          <div>
                            <span className="font-medium">Active:</span>
                            <span className="ml-2">{results.agent.result.analytics.activeServices}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Executed at: {results.agent.executedAt ? new Date(results.agent.executedAt).toLocaleString() : "N/A"}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Execute an agent action to see results</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}