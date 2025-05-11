import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface AISuggestion {
  id: number;
  title: string;
  description: string;
  primaryAction: string;
  type: string;
}

export default function AISuggestions() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch AI suggestions from the server
  const { data: suggestionsData, isLoading, refetch, error } = useQuery<AISuggestion[]>({
    queryKey: ['/api/ai/suggestions'],
    enabled: false,
  });
  
  // Handle loading state changes
  React.useEffect(() => {
    if (!isLoading && isGenerating) {
      setIsGenerating(false);
      
      if (error) {
        toast({
          title: "Error",
          description: `Failed to load AI suggestions: ${(error as Error).message}`,
          variant: "destructive",
        });
      }
    }
  }, [isLoading, error, toast, isGenerating]);
  
  const generateSuggestions = async () => {
    setIsGenerating(true);
    refetch();
  };
  
  // Fallback suggestions to use when there's no AI data yet
  const fallbackSuggestions = [
    {
      id: 1,
      title: "Follow up with Sarah Johnson",
      description: "It's been 3 days since your last email about the Urban Eats proposal. Consider sending a gentle follow-up.",
      primaryAction: "Compose Email",
      type: "email"
    },
    {
      id: 2,
      title: "Update QSR Franchise contact information",
      description: "Our AI detected that Alex Chen's title has changed to \"Business Development Manager\" based on his latest email signature.",
      primaryAction: "Update Contact",
      type: "contact"
    }
  ];
  
  // Use API data or fallback
  const suggestions = suggestionsData || fallbackSuggestions;

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-secondary-light text-white flex items-center justify-center mr-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-lg">AI Suggestions</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm px-3"
            onClick={generateSuggestions}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading || isGenerating ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="rounded-lg p-4 border border-neutral-light">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(suggestions) && suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-purple-50 rounded-lg p-4 border-l-4 border-secondary">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h4 className="text-neutral-dark font-medium mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-neutral-medium mb-3">{suggestion.description}</p>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="rounded-full bg-secondary text-white px-3 py-1 h-auto text-xs"
                      >
                        {suggestion.primaryAction}
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="rounded-full bg-white text-neutral-dark px-3 py-1 h-auto text-xs border-neutral-light"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
