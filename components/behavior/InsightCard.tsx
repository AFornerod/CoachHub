"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, Lightbulb, AlertTriangle, Sparkles, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

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

interface InsightCardProps {
  insight: BehaviorInsight;
  onToggleVisibility?: (id: string, newVisibility: "coach_only" | "client_shared") => void;
}

const INSIGHT_CONFIG = {
  strength: {
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Strength",
  },
  challenge: {
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    label: "Challenge",
  },
  opportunity: {
    icon: Lightbulb,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "Opportunity",
  },
  risk: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "Risk",
  },
};

const PRIORITY_CONFIG = {
  low: { color: "bg-gray-500", label: "Low" },
  medium: { color: "bg-blue-500", label: "Medium" },
  high: { color: "bg-orange-500", label: "High" },
  critical: { color: "bg-red-500", label: "Critical" },
};

export function InsightCard({ insight, onToggleVisibility }: InsightCardProps) {
  const config = INSIGHT_CONFIG[insight.insight_type];
  const Icon = config.icon;
  const priorityConfig = PRIORITY_CONFIG[insight.priority];

  function handleToggleVisibility() {
    if (onToggleVisibility) {
      const newVisibility = insight.visibility === "coach_only" ? "client_shared" : "coach_only";
      onToggleVisibility(insight.id, newVisibility);
    }
  }

  return (
    <Card className={`${config.borderColor} border-2`}>
      <CardHeader className={config.bgColor}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`${config.color} mt-1`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{insight.title}</CardTitle>
                {insight.ai_generated && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={config.color}>
                  {config.label}
                </Badge>
                <Badge className={priorityConfig.color}>
                  {priorityConfig.label} Priority
                </Badge>
              </div>
            </div>
          </div>

          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleVisibility}
              className="gap-2"
            >
              {insight.visibility === "client_shared" ? (
                <>
                  <Eye className="h-4 w-4" />
                  Shared
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Private
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <p className="text-sm mb-4">{insight.description}</p>

        {insight.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Recommendations:</h4>
            <ul className="space-y-2">
              {insight.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className={`${config.color} mt-0.5`}>•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Created {format(new Date(insight.created_at), "MMM dd, yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}