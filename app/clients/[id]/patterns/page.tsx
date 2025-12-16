"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BehaviorTracker } from "@/components/behavior/BehaviorTracker";
import { BehaviorTimeline } from "@/components/behavior/BehaviorTimeline";
import { InsightCard } from "@/components/behavior/InsightCard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowLeft,
  BarChart3,
  Loader2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface BehaviorPattern {
  id: string;
  pattern_type: string;
  pattern_title: string;
  pattern_description: string;
  frequency: string;
  confidence_score: number;
  status: string;
  actionable_insights: string[];
  created_at: string;
}

interface BehaviorInsight {
  id: string;
  insight_type: "strength" | "challenge" | "opportunity" | "risk";
  title: string;
  description: string;
  recommendations: string[];
  priority: "low" | "medium" | "high" | "critical";
  ai_generated: boolean;
  visibility: "coach_only" | "client_shared";
  created_at: string;
}

interface BehaviorObservation {
  observed_at: string;
  intensity: number;
  behavior_categories: {
    name: string;
  };
}

const PATTERN_ICONS = {
  recurring: Activity,
  escalating: TrendingUp,
  improving: TrendingDown,
  cyclical: Activity,
};

export default function BehaviorPatternsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [insights, setInsights] = useState<BehaviorInsight[]>([]);
  const [observations, setObservations] = useState<BehaviorObservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    setIsLoading(true);
    const supabase = createClient();

    const [clientRes, patternsRes, insightsRes, observationsRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("behavior_patterns").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("behavior_insights").select("*").eq("client_id", clientId).order("priority", { ascending: false }),
      supabase
        .from("behavior_observations")
        .select(`
          observed_at,
          intensity,
          behavior_categories!inner (
            name
          )
        `)
        .eq("client_id", clientId)
        .order("observed_at", { ascending: true }),
    ]);

    if (clientRes.data) setClient(clientRes.data);
    if (patternsRes.data) setPatterns(patternsRes.data);
    if (insightsRes.data) setInsights(insightsRes.data);
    if (observationsRes.data) {
      const transformedObservations = observationsRes.data.map((obs: any) => ({
        ...obs,
        behavior_categories: Array.isArray(obs.behavior_categories)
          ? obs.behavior_categories[0]
          : obs.behavior_categories,
      }));
      setObservations(transformedObservations);
    }

    setIsLoading(false);
  }

  async function analyzePatterns() {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze patterns");
      }

      const result = await response.json();
      toast.success(`Identified ${result.patterns} patterns and generated ${result.insights} insights`);
      await loadData();
    } catch (error) {
      console.error("Error analyzing patterns:", error);
      toast.error("Failed to analyze patterns");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleToggleVisibility(insightId: string, newVisibility: "coach_only" | "client_shared") {
    const supabase = createClient();
    const { error } = await supabase
      .from("behavior_insights")
      .update({ visibility: newVisibility })
      .eq("id", insightId);

    if (error) {
      toast.error("Failed to update visibility");
    } else {
      toast.success(`Insight ${newVisibility === "client_shared" ? "shared" : "hidden"} successfully`);
      setInsights(
        insights.map((insight) =>
          insight.id === insightId ? { ...insight, visibility: newVisibility } : insight
        )
      );
    }
  }

  const chartData = observations.map((obs) => ({
    date: format(new Date(obs.observed_at), "MMM dd"),
    intensity: obs.intensity,
    category: obs.behavior_categories.name,
  }));

  const patternStats = {
    recurring: patterns.filter((p) => p.pattern_type === "recurring").length,
    escalating: patterns.filter((p) => p.pattern_type === "escalating").length,
    improving: patterns.filter((p) => p.pattern_type === "improving").length,
    cyclical: patterns.filter((p) => p.pattern_type === "cyclical").length,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Behavior Patterns & Insights</h1>
              <p className="text-muted-foreground">{client?.name}</p>
            </div>
          </div>

          <Button onClick={analyzePatterns} disabled={isAnalyzing} className="gap-2">
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Patterns
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recurring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patternStats.recurring}</div>
              <p className="text-xs text-muted-foreground">Patterns identified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Escalating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{patternStats.escalating}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Improving</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{patternStats.improving}</div>
              <p className="text-xs text-muted-foreground">Positive trends</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cyclical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patternStats.cyclical}</div>
              <p className="text-xs text-muted-foreground">Repeating cycles</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="track">Track New</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {insights.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    No insights generated yet. Click "Analyze Patterns" to generate AI insights.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {patterns.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    No patterns identified yet. Record more observations and analyze patterns.
                  </div>
                </CardContent>
              </Card>
            ) : (
              patterns.map((pattern) => {
                const Icon = PATTERN_ICONS[pattern.pattern_type as keyof typeof PATTERN_ICONS];
                return (
                  <Card key={pattern.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-1" />
                          <div>
                            <CardTitle>{pattern.pattern_title}</CardTitle>
                            <CardDescription className="mt-2">{pattern.pattern_description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge>{pattern.pattern_type}</Badge>
                          <Badge variant="outline">
                            {Math.round(pattern.confidence_score * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Frequency</h4>
                          <p className="text-sm text-muted-foreground">{pattern.frequency}</p>
                        </div>

                        {pattern.actionable_insights.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Actionable Insights</h4>
                            <ul className="space-y-1">
                              {pattern.actionable_insights.map((insight, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span>•</span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <BehaviorTimeline clientId={clientId} />
          </TabsContent>

          <TabsContent value="track">
            <BehaviorTracker clientId={clientId} onSave={loadData} />
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Behavior Intensity Trends
                </CardTitle>
                <CardDescription>
                  Track how behavior intensity changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No observation data available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="intensity"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}