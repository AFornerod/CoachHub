'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { MoodSelector } from './MoodSelector';
import { EnergyLevelSlider } from './EnergyLevelSlider';
import { ActionItemsManager } from './ActionItemsManager';
import { Loader2, Plus, X } from 'lucide-react';

interface ActionItem {
  item: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface SessionResultFormProps {
  sessionId: string;
  initialData?: any;
  onSave?: () => void;
}

export function SessionResultForm({ sessionId, initialData, onSave }: SessionResultFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    preSessionMood: initialData?.pre_session_mood || '',
    postSessionMood: initialData?.post_session_mood || '',
    energyLevelStart: initialData?.energy_level_start || 5,
    energyLevelEnd: initialData?.energy_level_end || 5,
    sessionFocus: initialData?.session_focus || [],
    techniquesUsed: initialData?.techniques_used || [],
    breakthroughMoments: initialData?.breakthrough_moments || [],
    challengesDiscussed: initialData?.challenges_discussed || [],
    coachObservations: initialData?.coach_observations || '',
    clientFeedback: initialData?.client_feedback || '',
    whatWorkedWell: initialData?.what_worked_well || '',
    whatToImprove: initialData?.what_to_improve || '',
    actionItems: initialData?.action_items || [] as ActionItem[],
    clientCommitments: initialData?.client_commitments || [],
    coachCommitments: initialData?.coach_commitments || [],
    nextSessionFocus: initialData?.next_session_focus || '',
  });

  const [newFocus, setNewFocus] = useState('');
  const [newTechnique, setNewTechnique] = useState('');
  const [newBreakthrough, setNewBreakthrough] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [newClientCommitment, setNewClientCommitment] = useState('');
  const [newCoachCommitment, setNewCoachCommitment] = useState('');

  const addToArray = (field: string, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field as keyof typeof prev] as string[], value]
      }));
      setter('');
    }
  };

  const removeFromArray = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      await supabase
        .from('sessions')
        .update({
          pre_session_mood: formData.preSessionMood,
          post_session_mood: formData.postSessionMood,
          energy_level_start: formData.energyLevelStart,
          energy_level_end: formData.energyLevelEnd,
          session_focus: formData.sessionFocus,
          techniques_used: formData.techniquesUsed,
          breakthrough_moments: formData.breakthroughMoments,
          challenges_discussed: formData.challengesDiscussed,
          coach_observations: formData.coachObservations,
          client_feedback: formData.clientFeedback,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      const { data: existingResult } = await supabase
        .from('session_results')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      const resultData = {
        session_id: sessionId,
        what_worked_well: formData.whatWorkedWell,
        what_to_improve: formData.whatToImprove,
        action_items: formData.actionItems,
        client_commitments: formData.clientCommitments,
        coach_commitments: formData.coachCommitments,
        next_session_focus: formData.nextSessionFocus,
        updated_at: new Date().toISOString(),
      };

      if (existingResult) {
        await supabase
          .from('session_results')
          .update(resultData)
          .eq('id', existingResult.id);
      } else {
        await supabase
          .from('session_results')
          .insert(resultData);
      }

      toast({
        title: 'Guardado exitoso',
        description: 'Los resultados de la sesión se han guardado correctamente',
      });

      if (onSave) {
        onSave();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving session results:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los resultados',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estado Pre-Sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MoodSelector
            label="Estado de ánimo antes de la sesión"
            value={formData.preSessionMood}
            onChange={(value) => setFormData(prev => ({ ...prev, preSessionMood: value }))}
          />
          <EnergyLevelSlider
            label="Nivel de energía al inicio"
            value={formData.energyLevelStart}
            onChange={(value) => setFormData(prev => ({ ...prev, energyLevelStart: value }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Durante la Sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Enfoque de la sesión</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {formData.sessionFocus.map((focus: string, i: number) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {focus}
                  <button
                    type="button"
                    onClick={() => removeFromArray('sessionFocus', i)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newFocus}
                onChange={(e) => setNewFocus(e.target.value)}
                placeholder="Añadir tema tratado..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('sessionFocus', newFocus, setNewFocus);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addToArray('sessionFocus', newFocus, setNewFocus)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Técnicas utilizadas</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {formData.techniquesUsed.map((technique: string, i: number) => (
                <Badge key={i} variant="outline" className="gap-1">
                  {technique}
                  <button
                    type="button"
                    onClick={() => removeFromArray('techniquesUsed', i)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTechnique}
                onChange={(e) => setNewTechnique(e.target.value)}
                placeholder="Ej: Rueda de la vida, Preguntas poderosas..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('techniquesUsed', newTechnique, setNewTechnique);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addToArray('techniquesUsed', newTechnique, setNewTechnique)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Momentos de revelación</Label>
            <div className="space-y-2 mb-2">
              {formData.breakthroughMoments.map((moment: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="flex-1 text-sm">{moment}</p>
                  <button
                    type="button"
                    onClick={() => removeFromArray('breakthroughMoments', i)}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newBreakthrough}
                onChange={(e) => setNewBreakthrough(e.target.value)}
                placeholder="Describe un momento importante de la sesión..."
                className="min-h-[60px]"
              />
              <Button
                type="button"
                onClick={() => addToArray('breakthroughMoments', newBreakthrough, setNewBreakthrough)}
                size="icon"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Desafíos discutidos</Label>
            <div className="space-y-2 mb-2">
              {formData.challengesDiscussed.map((challenge: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="flex-1 text-sm">{challenge}</p>
                  <button
                    type="button"
                    onClick={() => removeFromArray('challengesDiscussed', i)}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newChallenge}
                onChange={(e) => setNewChallenge(e.target.value)}
                placeholder="Añadir desafío..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('challengesDiscussed', newChallenge, setNewChallenge);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addToArray('challengesDiscussed', newChallenge, setNewChallenge)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Observaciones del coach</Label>
            <Textarea
              value={formData.coachObservations}
              onChange={(e) => setFormData(prev => ({ ...prev, coachObservations: e.target.value }))}
              placeholder="Notas privadas sobre la sesión, patrones observados, etc."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado Post-Sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MoodSelector
            label="Estado de ánimo después de la sesión"
            value={formData.postSessionMood}
            onChange={(value) => setFormData(prev => ({ ...prev, postSessionMood: value }))}
          />
          <EnergyLevelSlider
            label="Nivel de energía al finalizar"
            value={formData.energyLevelEnd}
            onChange={(value) => setFormData(prev => ({ ...prev, energyLevelEnd: value }))}
          />
          <div>
            <Label>Feedback del cliente</Label>
            <Textarea
              value={formData.clientFeedback}
              onChange={(e) => setFormData(prev => ({ ...prev, clientFeedback: e.target.value }))}
              placeholder="¿Qué dijo el cliente sobre la sesión?"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evaluación de la Sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>¿Qué funcionó bien?</Label>
            <Textarea
              value={formData.whatWorkedWell}
              onChange={(e) => setFormData(prev => ({ ...prev, whatWorkedWell: e.target.value }))}
              placeholder="Aspectos positivos y efectivos de la sesión..."
              className="min-h-[80px]"
            />
          </div>
          <div>
            <Label>¿Qué mejorar?</Label>
            <Textarea
              value={formData.whatToImprove}
              onChange={(e) => setFormData(prev => ({ ...prev, whatToImprove: e.target.value }))}
              placeholder="Áreas de oportunidad para futuras sesiones..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones y Compromisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActionItemsManager
            label="Acciones acordadas"
            items={formData.actionItems}
            onChange={(items) => setFormData(prev => ({ ...prev, actionItems: items }))}
          />

          <div>
            <Label>Compromisos del cliente</Label>
            <div className="space-y-2 mb-2">
              {formData.clientCommitments.map((commitment: string, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="flex-1 text-sm">{commitment}</p>
                  <button
                    type="button"
                    onClick={() => removeFromArray('clientCommitments', i)}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newClientCommitment}
                onChange={(e) => setNewClientCommitment(e.target.value)}
                placeholder="Añadir compromiso del cliente..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('clientCommitments', newClientCommitment, setNewClientCommitment);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addToArray('clientCommitments', newClientCommitment, setNewClientCommitment)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Compromisos del coach</Label>
            <div className="space-y-2 mb-2">
              {formData.coachCommitments.map((commitment: string, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="flex-1 text-sm">{commitment}</p>
                  <button
                    type="button"
                    onClick={() => removeFromArray('coachCommitments', i)}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCoachCommitment}
                onChange={(e) => setNewCoachCommitment(e.target.value)}
                placeholder="Añadir compromiso del coach..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('coachCommitments', newCoachCommitment, setNewCoachCommitment);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addToArray('coachCommitments', newCoachCommitment, setNewCoachCommitment)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próxima Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Enfoque para la próxima sesión</Label>
          <Textarea
            value={formData.nextSessionFocus}
            onChange={(e) => setFormData(prev => ({ ...prev, nextSessionFocus: e.target.value }))}
            placeholder="¿En qué nos enfocaremos en la siguiente sesión?"
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Resultados
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
