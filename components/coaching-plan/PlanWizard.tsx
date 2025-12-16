'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight, Check, Loader2, Plus, X } from 'lucide-react';
import { SMARTGoalForm } from './SMARTGoalForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const steps = [
  { title: 'Información Básica', description: 'Datos generales del plan' },
  { title: 'Fases del Plan', description: 'Estructura temporal' },
  { title: 'Objetivos SMART', description: 'Metas específicas' },
  { title: 'Revisión', description: 'Confirmar y crear' },
];

interface PlanWizardProps {
  clientId: string;
  clientName: string;
  onComplete: (planId: string) => void;
}

export function PlanWizard({ clientId, clientName, onComplete }: PlanWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  const [planData, setPlanData] = useState({
    title: '',
    description: '',
    startDate: '',
    targetEndDate: '',
    totalSessionsPlanned: 0,
    coachingApproach: '',
    focusAreas: [] as string[],
    phases: [] as Array<{ name: string; duration: string; goals: string[] }>,
  });

  const [objectives, setObjectives] = useState<any[]>([]);
  const [newFocusArea, setNewFocusArea] = useState('');
  const [newPhase, setNewPhase] = useState({ name: '', duration: '', goals: [] as string[] });
  const [newPhaseGoal, setNewPhaseGoal] = useState('');

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const addFocusArea = () => {
    if (newFocusArea.trim()) {
      setPlanData(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, newFocusArea]
      }));
      setNewFocusArea('');
    }
  };

  const removeFocusArea = (index: number) => {
    setPlanData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.filter((_, i) => i !== index)
    }));
  };

  const addPhaseGoal = () => {
    if (newPhaseGoal.trim()) {
      setNewPhase(prev => ({
        ...prev,
        goals: [...prev.goals, newPhaseGoal]
      }));
      setNewPhaseGoal('');
    }
  };

  const removePhaseGoal = (index: number) => {
    setNewPhase(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const addPhase = () => {
    if (newPhase.name && newPhase.duration) {
      setPlanData(prev => ({
        ...prev,
        phases: [...prev.phases, newPhase]
      }));
      setNewPhase({ name: '', duration: '', goals: [] });
    }
  };

  const removePhase = (index: number) => {
    setPlanData(prev => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index)
    }));
  };

  const removeObjective = (index: number) => {
    setObjectives(prev => prev.filter((_, i) => i !== index));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return planData.title && planData.startDate && planData.targetEndDate;
      case 1:
        return planData.phases.length > 0;
      case 2:
        return objectives.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCreatePlan = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      const { data: plan, error: planError } = await supabase
        .from('coaching_plans')
        .insert({
          client_id: clientId,
          coach_id: user.id,
          title: planData.title,
          description: planData.description,
          start_date: planData.startDate,
          target_end_date: planData.targetEndDate,
          total_sessions_planned: planData.totalSessionsPlanned,
          coaching_approach: planData.coachingApproach,
          focus_areas: planData.focusAreas,
          phases: planData.phases,
          status: 'active',
          sessions_completed: 0,
        })
        .select()
        .single();

      if (planError) throw planError;

      const objectivesWithPlanId = objectives.map(obj => ({
        plan_id: plan.id,
        title: obj.title,
        description: obj.description,
        specific: obj.specific,
        measurable: obj.measurable,
        achievable: obj.achievable,
        relevant: obj.relevant,
        time_bound: obj.timeBound,
        category: obj.category,
        priority: obj.priority,
        target_value: obj.targetValue ? parseFloat(obj.targetValue) : null,
        current_value: obj.current_value,
        unit: obj.unit,
        status: obj.status,
        progress: obj.progress,
      }));

      const { error: objectivesError } = await supabase
        .from('plan_objectives')
        .insert(objectivesWithPlanId);

      if (objectivesError) throw objectivesError;

      toast({
        title: 'Plan creado exitosamente',
        description: `El plan de coaching para ${clientName} ha sido creado.`,
      });

      onComplete(plan.id);
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el plan de coaching',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica del Plan</CardTitle>
                <CardDescription>
                  Define los datos generales del plan de coaching para {clientName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título del Plan *</Label>
                  <Input
                    value={planData.title}
                    onChange={(e) => setPlanData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Plan de Desarrollo de Liderazgo"
                  />
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={planData.description}
                    onChange={(e) => setPlanData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe el propósito y alcance del plan..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha de Inicio *</Label>
                    <Input
                      type="date"
                      value={planData.startDate}
                      onChange={(e) => setPlanData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Fecha Objetivo *</Label>
                    <Input
                      type="date"
                      value={planData.targetEndDate}
                      onChange={(e) => setPlanData(prev => ({ ...prev, targetEndDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Número de Sesiones Planificadas</Label>
                  <Input
                    type="number"
                    value={planData.totalSessionsPlanned}
                    onChange={(e) => setPlanData(prev => ({ ...prev, totalSessionsPlanned: parseInt(e.target.value) || 0 }))}
                    placeholder="12"
                  />
                </div>

                <div>
                  <Label>Enfoque/Metodología</Label>
                  <Input
                    value={planData.coachingApproach}
                    onChange={(e) => setPlanData(prev => ({ ...prev, coachingApproach: e.target.value }))}
                    placeholder="Ej: GROW, Ontológico, Sistémico"
                  />
                </div>

                <div>
                  <Label>Áreas de Enfoque</Label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {planData.focusAreas.map((area: string, i: number) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {area}
                        <button
                          type="button"
                          onClick={() => removeFocusArea(i)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newFocusArea}
                      onChange={(e) => setNewFocusArea(e.target.value)}
                      placeholder="Ej: Liderazgo, Comunicación..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFocusArea();
                        }
                      }}
                    />
                    <Button type="button" onClick={addFocusArea} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fases del Plan</CardTitle>
                <CardDescription>
                  Divide el plan en fases con objetivos específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {planData.phases.map((phase: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{phase.name}</h4>
                            <p className="text-sm text-gray-600">Duración: {phase.duration}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePhase(i)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        {phase.goals.length > 0 && (
                          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                            {phase.goals.map((goal: string, j: number) => (
                              <li key={j}>{goal}</li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4 space-y-3">
                  <h4 className="font-medium">Añadir Nueva Fase</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      value={newPhase.name}
                      onChange={(e) => setNewPhase(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre de la fase"
                    />
                    <Input
                      value={newPhase.duration}
                      onChange={(e) => setNewPhase(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="Duración (Ej: 3 meses)"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Objetivos de la fase</Label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {newPhase.goals.map((goal: string, i: number) => (
                        <Badge key={i} variant="outline" className="gap-1">
                          {goal}
                          <button
                            type="button"
                            onClick={() => removePhaseGoal(i)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newPhaseGoal}
                        onChange={(e) => setNewPhaseGoal(e.target.value)}
                        placeholder="Añadir objetivo de la fase..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addPhaseGoal();
                          }
                        }}
                      />
                      <Button type="button" onClick={addPhaseGoal} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button type="button" onClick={addPhase} variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Fase
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Objetivos SMART</CardTitle>
                <CardDescription>
                  Define los objetivos específicos que el cliente trabajará
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {objectives.map((obj: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{obj.title}</h4>
                            <Badge>{obj.category}</Badge>
                            <Badge variant={obj.priority === 'high' ? 'destructive' : 'outline'}>
                              {obj.priority === 'high' ? 'Alta' : obj.priority === 'medium' ? 'Media' : 'Baja'}
                            </Badge>
                          </div>
                          {obj.description && (
                            <p className="text-sm text-gray-600">{obj.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Fecha límite: {new Date(obj.timeBound).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeObjective(i)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  onClick={() => setShowGoalDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Objetivo SMART
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revisión del Plan</CardTitle>
                <CardDescription>
                  Revisa toda la información antes de crear el plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Información General</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Título:</dt>
                      <dd className="font-medium">{planData.title}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Cliente:</dt>
                      <dd className="font-medium">{clientName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Duración:</dt>
                      <dd className="font-medium">
                        {new Date(planData.startDate).toLocaleDateString('es-ES')} - {new Date(planData.targetEndDate).toLocaleDateString('es-ES')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Sesiones planificadas:</dt>
                      <dd className="font-medium">{planData.totalSessionsPlanned}</dd>
                    </div>
                  </dl>
                </div>

                {planData.focusAreas.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Áreas de Enfoque</h4>
                    <div className="flex gap-2 flex-wrap">
                      {planData.focusAreas.map((area: string, i: number) => (
                        <Badge key={i} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Fases del Plan</h4>
                  <p className="text-sm text-gray-600">{planData.phases.length} fase(s) definida(s)</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Objetivos SMART</h4>
                  <p className="text-sm text-gray-600">{objectives.length} objetivo(s) definido(s)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
            <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
          </div>
          <span className="text-sm text-gray-600">
            Paso {currentStep + 1} de {steps.length}
          </span>
        </div>
        {/* <Progress value={progressPercentage} /> */}
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      {renderStepContent()}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext()}
          >
            Siguiente
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleCreatePlan}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Check className="mr-2 h-4 w-4" />
            Crear Plan
          </Button>
        )}
      </div>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Objetivo SMART</DialogTitle>
          </DialogHeader>
          <SMARTGoalForm
            onSave={(goal) => {
              setObjectives(prev => [...prev, goal]);
              setShowGoalDialog(false);
            }}
            onCancel={() => setShowGoalDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
