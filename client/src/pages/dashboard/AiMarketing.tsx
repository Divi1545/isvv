import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const AiMarketing = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  
  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Simulate API call to OpenAI for content generation
    setTimeout(() => {
      setGeneratedContent(
        "🌴 Experience paradise at Beach Paradise Villa! Wake up to stunning ocean views and white sand beaches just steps from your doorstep. Our luxury beachfront accommodation features a private pool, outdoor dining area, and modern amenities. Perfect for families and couples seeking a tranquil escape. Book now for our summer special - 15% off for stays of 5+ nights! #IslandGetaway #SriLanka #LuxuryTravel"
      );
      setIsGenerating(false);
    }, 2000);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">AI Marketing</h1>
        <Button 
          variant="outline" 
          className="w-full md:w-auto"
          onClick={() => setGeneratedContent(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M11 20A7 7 0 0 1 4 13c0-3.4 2.5-6.8 7-10a6.95 6.95 0 0 1 .5.42c4.5 3.2 7 6.6 7 9.58A7 7 0 0 1 11 20Z"></path>
            <circle cx="11" cy="13" r="2"></circle>
          </svg>
          View Past Content
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">AI Generator</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Type</label>
                  <Select defaultValue="social">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social Media Post</SelectItem>
                      <SelectItem value="email">Email Newsletter</SelectItem>
                      <SelectItem value="description">Listing Description</SelectItem>
                      <SelectItem value="seo">SEO Content</SelectItem>
                      <SelectItem value="promotion">Promotional Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select defaultValue="instagram">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Audience</label>
                  <Select defaultValue="travelers">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travelers">General Travelers</SelectItem>
                      <SelectItem value="families">Families</SelectItem>
                      <SelectItem value="couples">Couples</SelectItem>
                      <SelectItem value="adventure">Adventure Seekers</SelectItem>
                      <SelectItem value="luxury">Luxury Travelers</SelectItem>
                      <SelectItem value="budget">Budget Travelers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Length</label>
                  <Select defaultValue="medium">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (50-100 words)</SelectItem>
                      <SelectItem value="medium">Medium (100-200 words)</SelectItem>
                      <SelectItem value="long">Long (200-300 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <RadioGroup defaultValue="friendly" className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="friendly" id="friendly" />
                      <Label htmlFor="friendly">Friendly & Casual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="professional" id="professional" />
                      <Label htmlFor="professional">Professional</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="luxury" id="luxury" />
                      <Label htmlFor="luxury">Luxury & Exclusive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="exciting" id="exciting" />
                      <Label htmlFor="exciting">Exciting & Adventurous</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Points to Include</label>
                  <Textarea 
                    placeholder="Enter specific details you want to highlight..." 
                    className="min-h-[100px]"
                    defaultValue="Beachfront villa, private pool, summer special offer, proximity to attractions"
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M11 12H3"></path>
                        <path d="m15 16 4-4-4-4"></path>
                        <path d="M3 4h18"></path>
                        <path d="M11 20h10"></path>
                        <circle cx="3" cy="20" r="1"></circle>
                        <circle cx="7" cy="12" r="1"></circle>
                        <circle cx="19" cy="4" r="1"></circle>
                      </svg>
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Inspiration</h3>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Top Performing Posts</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Posts about local experiences and cultural insights get 3x more engagement than generic content.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Trending Topics</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sustainable tourism and eco-friendly accommodations are trending search terms for Sri Lanka.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Competitive Edge</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Highlight your unique amenities and proximity to attractions to stand out from competitors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            {generatedContent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Generated Content</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                      </svg>
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" x2="12" y1="15" y2="3"></line>
                      </svg>
                      Download
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="prose max-w-none">
                    <p>{generatedContent}</p>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="p-4 border-b">
                    <h4 className="font-medium">Instagram Preview</h4>
                  </div>
                  <div className="flex p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="text-primary font-medium">BP</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">beachparadisevilla</p>
                      <p className="text-xs text-muted-foreground">Sri Lanka</p>
                    </div>
                  </div>
                  <div className="h-60 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                        <circle cx="9" cy="9" r="2"></circle>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                      </svg>
                      Add an image
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm leading-relaxed mb-1">
                      <span className="font-medium">beachparadisevilla</span> {generatedContent?.split('#')[0]}
                    </p>
                    <p className="text-sm text-blue-600">
                      #IslandGetaway #SriLanka #LuxuryTravel
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">2 MINUTES AGO</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Regenerate</Button>
                  <Button>Use This Content</Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-purple-100 p-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    <path d="M3.22 12H9.5l.5-1 2 4 .5-7 2 4h6.7"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">AI Content Generator</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Create engaging marketing content for your business with our AI-powered assistant. Select your content type and preferences on the left, then click "Generate Content" to get started.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  <div className="p-3 border rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-blue-500">
                      <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path>
                      <polygon points="12 15 17 21 7 21 12 15"></polygon>
                    </svg>
                    <p className="text-xs font-medium">Social Media</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-green-500">
                      <rect width="16" height="13" x="4" y="5" rx="2"></rect>
                      <path d="m16 8-4 4-4-4"></path>
                      <path d="M4 13.5 9 17l.5.5.5-.5L16 13.5"></path>
                    </svg>
                    <p className="text-xs font-medium">Email Campaigns</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-amber-500">
                      <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"></path>
                      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path>
                      <path d="M3 7h18"></path>
                      <path d="M5 21h14"></path>
                    </svg>
                    <p className="text-xs font-medium">Listing Details</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AiMarketing;