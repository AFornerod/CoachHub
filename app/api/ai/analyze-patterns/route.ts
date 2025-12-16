import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const { data: observations, error: obsError } = await supabase
      .from("behavior_observations")
      .select(`
        *,
        behavior_categories (
          name,
          description
        )
      `)
      .eq("client_id", clientId)
      .order("observed_at", { ascending: false })
      .limit(50);

    if (obsError || !observations || observations.length === 0) {
      return NextResponse.json(
        { error: "No behavior observations found for analysis" },
        { status: 404 }
      );
    }

    const prompt = `You are an expert coaching analyst. Analyze the following behavior observations for a coaching client and identify:

1. Recurring patterns
2. Escalating behaviors (getting worse)
3. Improving behaviors (getting better)
4. Cyclical patterns (repeating in cycles)

For each pattern found, provide:
- Pattern type (recurring/escalating/improving/cyclical)
- Pattern title (short, descriptive)
- Pattern description (detailed explanation)
- Frequency description
- Common triggers
- Confidence score (0-1)
- Actionable insights

BEHAVIOR OBSERVATIONS:
${observations.map((obs: any, i: number) => `
${i + 1}. ${obs.behavior_categories.name} - ${obs.behavior_title}
   Description: ${obs.behavior_description}
   Context: ${obs.context}
   Intensity: ${obs.intensity}/10
   Emotional State: ${obs.emotional_state}
   Triggers: ${obs.triggers.join(", ")}
   Date: ${new Date(obs.observed_at).toLocaleDateString()}
`).join("\n")}

Return your analysis as a JSON array of pattern objects with this structure:
{
  "patterns": [
    {
      "pattern_type": "recurring|escalating|improving|cyclical",
      "pattern_title": "string",
      "pattern_description": "string",
      "frequency": "string",
      "identified_triggers": ["trigger1", "trigger2"],
      "confidence_score": 0.85,
      "actionable_insights": ["insight1", "insight2"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert coaching analyst specializing in behavioral pattern recognition. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error("No response from AI");
    }

    const analysis = JSON.parse(analysisText);

    const patternsToInsert = analysis.patterns.map((pattern: any) => ({
      coach_id: user.id,
      client_id: clientId,
      pattern_type: pattern.pattern_type,
      pattern_title: pattern.pattern_title,
      pattern_description: pattern.pattern_description,
      frequency: pattern.frequency,
      identified_triggers: pattern.identified_triggers,
      confidence_score: pattern.confidence_score,
      actionable_insights: pattern.actionable_insights,
      status: "active",
      related_behaviors: observations.slice(0, 10).map((o: any) => o.id),
    }));

    const { data: patterns, error: patternError } = await supabase
      .from("behavior_patterns")
      .insert(patternsToInsert)
      .select();

    if (patternError) {
      console.error("Error saving patterns:", patternError);
      throw patternError;
    }

    const insightsToInsert = [];
    for (const pattern of patterns) {
      const patternData = analysis.patterns.find(
        (p: any) => p.pattern_title === pattern.pattern_title
      );

      let insightType: "strength" | "challenge" | "opportunity" | "risk";
      if (pattern.pattern_type === "improving") {
        insightType = "strength";
      } else if (pattern.pattern_type === "escalating") {
        insightType = "risk";
      } else if (pattern.pattern_type === "recurring") {
        insightType = "challenge";
      } else {
        insightType = "opportunity";
      }

      let priority: "low" | "medium" | "high" | "critical";
      if (pattern.confidence_score > 0.8) {
        priority = pattern.pattern_type === "escalating" ? "critical" : "high";
      } else if (pattern.confidence_score > 0.6) {
        priority = "medium";
      } else {
        priority = "low";
      }

      insightsToInsert.push({
        coach_id: user.id,
        client_id: clientId,
        pattern_id: pattern.id,
        insight_type: insightType,
        title: pattern.pattern_title,
        description: pattern.pattern_description,
        recommendations: patternData?.actionable_insights || [],
        priority,
        ai_generated: true,
        visibility: "coach_only",
      });
    }

    const { data: insights, error: insightError } = await supabase
      .from("behavior_insights")
      .insert(insightsToInsert)
      .select();

    if (insightError) {
      console.error("Error saving insights:", insightError);
      throw insightError;
    }

    return NextResponse.json({
      success: true,
      patterns: patterns.length,
      insights: insights.length,
      data: {
        patterns,
        insights,
      },
    });
  } catch (error) {
    console.error("Error analyzing patterns:", error);
    return NextResponse.json(
      { error: "Failed to analyze patterns" },
      { status: 500 }
    );
  }
}