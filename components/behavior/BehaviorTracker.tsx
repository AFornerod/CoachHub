"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface BehaviorCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface BehaviorTrackerProps {
  clientId: string;
  sessionId?: string;
  onSave?: () => void;
}

const EMOTIONAL_STATES = [
  "Calm", "Anxious", "Excited", "Frustrated", "Confident", "Uncertain",
  "Motivated", "Overwhelmed", "Hopeful", "Discouraged", "Angry", "Content"
];

export function BehaviorTracker({ clientId, sessionId, onSave }: BehaviorTrackerProps) {
  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    behavior_title: "",
    behavior_description: "",
    context: "",
    intensity: 5,
    emotional_state: "",
    triggers: [] as string[],
  });
  const [triggerInput, setTriggerInput] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("behavior_categories")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load categories");
      return;
    }

    setCategories(data || []);
  }

  function addTrigger() {
    if (triggerInput.trim() && !formData.triggers.includes(triggerInput.trim())) {
      setFormData({
        ...formData,
        triggers: [...formData.triggers, triggerInput.trim()],
      });
      setTriggerInput("");
    }
  }

  function removeTrigger(trigger: string) {
    setFormData({
      ...formData,
      triggers: formData.triggers.filter(t => t !== trigger),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.category_id || !formData.behavior_title || !formData.behavior_description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase
        .from("behavior_observations")
        .insert({
          coach_id: user.id,
          client_id: clientId,
          session_id: sessionId || null,
          ...formData,
        });

      if (error) throw error;

      toast.success("Behavior observation recorded");

      setFormData({
        category_id: "",
        behavior_title: "",
        behavior_description: "",
        context: "",
        intensity: 5,
        emotional_state: "",
        triggers: [],
      });

      onSave?.();
    } catch (error) {
      console.error("Error saving observation:", error);
      toast.error("Failed to save observation");
    } finally {
      setIsLoading(false);
    }
  }

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Behavior Observation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Behavior Title *</Label>
            <Input
              id="title"
              placeholder="Brief title of the observed behavior"
              value={formData.behavior_title}
              onChange={(e) => setFormData({ ...formData, behavior_title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of what you observed..."
              value={formData.behavior_description}
              onChange={(e) => setFormData({ ...formData, behavior_description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context</Label>
            <Textarea
              id="context"
              placeholder="What was happening when this behavior occurred?"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Intensity: {formData.intensity}/10</Label>
            <Slider
              value={[formData.intensity]}
              onValueChange={([value]) => setFormData({ ...formData, intensity: value })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emotional-state">Emotional State</Label>
            <Select
              value={formData.emotional_state}
              onValueChange={(value) => setFormData({ ...formData, emotional_state: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select emotional state" />
              </SelectTrigger>
              <SelectContent>
                {EMOTIONAL_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggers">Triggers</Label>
            <div className="flex gap-2">
              <Input
                id="triggers"
                placeholder="Add a trigger..."
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTrigger();
                  }
                }}
              />
              <Button type="button" onClick={addTrigger} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.triggers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.triggers.map((trigger) => (
                  <Badge key={trigger} variant="secondary">
                    {trigger}
                    <button
                      type="button"
                      onClick={() => removeTrigger(trigger)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Saving..." : "Record Observation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}