"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Heart, Zap, AlertTriangle } from "lucide-react";

interface BehaviorObservation {
  id: string;
  behavior_title: string;
  behavior_description: string;
  context: string;
  intensity: number;
  emotional_state: string;
  triggers: string[];
  observed_at: string;
  behavior_categories: {
    name: string;
    color: string;
    icon: string;
  };
}

interface BehaviorTimelineProps {
  clientId: string;
  sessionId?: string;
  maxHeight?: string;
}

export function BehaviorTimeline({ clientId, sessionId, maxHeight = "600px" }: BehaviorTimelineProps) {
  const [observations, setObservations] = useState<BehaviorObservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadObservations();
  }, [clientId, sessionId]);

  async function loadObservations() {
    setIsLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("behavior_observations")
      .select(`
        *,
        behavior_categories (
          name,
          color,
          icon
        )
      `)
      .eq("client_id", clientId)
      .order("observed_at", { ascending: false });

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading observations:", error);
    } else {
      setObservations(data || []);
    }

    setIsLoading(false);
  }

  function getIntensityColor(intensity: number): string {
    if (intensity <= 3) return "text-green-600";
    if (intensity <= 6) return "text-yellow-600";
    return "text-red-600";
  }

  function getIntensityIcon(intensity: number) {
    if (intensity <= 3) return <Heart className="h-4 w-4" />;
    if (intensity <= 6) return <Zap className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Behavior Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading observations...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (observations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Behavior Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No behavior observations recorded yet</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavior Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-4">
            {observations.map((observation, index) => (
              <div key={observation.id}>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: observation.behavior_categories.color + "20" }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: observation.behavior_categories.color }}
                      />
                    </div>
                    {index < observations.length - 1 && (
                      <div className="w-0.5 h-full min-h-[60px] bg-border mt-2" />
                    )}
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{observation.behavior_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(observation.observed_at), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 ${getIntensityColor(observation.intensity)}`}>
                        {getIntensityIcon(observation.intensity)}
                        <span className="text-sm font-medium">{observation.intensity}/10</span>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: observation.behavior_categories.color + "20",
                        color: observation.behavior_categories.color,
                      }}
                      className="mb-2"
                    >
                      {observation.behavior_categories.name}
                    </Badge>

                    <p className="text-sm mb-2">{observation.behavior_description}</p>

                    {observation.context && (
                      <div className="bg-muted p-2 rounded text-sm mb-2">
                        <span className="font-medium">Context:</span> {observation.context}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {observation.emotional_state && (
                        <Badge variant="outline">
                          <Heart className="h-3 w-3 mr-1" />
                          {observation.emotional_state}
                        </Badge>
                      )}

                      {observation.triggers.map((trigger) => (
                        <Badge key={trigger} variant="outline">
                          <Zap className="h-3 w-3 mr-1" />
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {index < observations.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}