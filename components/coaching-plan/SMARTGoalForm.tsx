'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SMARTGoalFormProps {
  onSave: (goal: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function SMARTGoalForm({ onSave, onCancel, initialData }: SMARTGoalFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    specific: initialData?.specific || '',
    measurable: initialData?.measurable || '',
    achievable: initialData?.achievable || '',
    relevant: initialData?.relevant || '',
    timeBound: initialData?.time_bound || '',
    category: initialData?.category || 'Professional',
    priority: initialData?.priority || 'medium',
    targetValue: initialData?.target_value || '',
    unit: initialData?.unit || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      status: 'not_started',
      progress: 0,
      current_value: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>
            Define el título y descripción del objetivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título del Objetivo *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Mejorar habilidades de liderazgo"
              required
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe el objetivo en detalle..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Professional">Profesional</SelectItem>
                  <SelectItem value="Health">Salud</SelectItem>
                  <SelectItem value="Financial">Financiero</SelectItem>
                  <SelectItem value="Relationships">Relaciones</SelectItem>
                  <SelectItem value="Skills">Habilidades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criterios SMART</CardTitle>
          <CardDescription>
            Asegura que tu objetivo cumpla con los criterios SMART
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-50">S</Badge>
              <Label>Específico (Specific)</Label>
            </div>
            <Textarea
              value={formData.specific}
              onChange={(e) => setFormData(prev => ({ ...prev, specific: e.target.value }))}
              placeholder="¿Qué se quiere lograr exactamente? Sé específico y claro..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-green-50">M</Badge>
              <Label>Medible (Measurable)</Label>
            </div>
            <Textarea
              value={formData.measurable}
              onChange={(e) => setFormData(prev => ({ ...prev, measurable: e.target.value }))}
              placeholder="¿Cómo sabrás que lo has logrado? ¿Qué métricas usarás?"
              className="min-h-[80px]"
            />
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-xs">Valor objetivo (opcional)</Label>
                <Input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                  placeholder="100"
                />
              </div>
              <div>
                <Label className="text-xs">Unidad de medida</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="kg, %, sesiones, etc."
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-yellow-50">A</Badge>
              <Label>Alcanzable (Achievable)</Label>
            </div>
            <Textarea
              value={formData.achievable}
              onChange={(e) => setFormData(prev => ({ ...prev, achievable: e.target.value }))}
              placeholder="¿Es realista? ¿Qué recursos y capacidades tienes?"
              className="min-h-[80px]"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-purple-50">R</Badge>
              <Label>Relevante (Relevant)</Label>
            </div>
            <Textarea
              value={formData.relevant}
              onChange={(e) => setFormData(prev => ({ ...prev, relevant: e.target.value }))}
              placeholder="¿Por qué es importante? ¿Cómo se alinea con objetivos mayores?"
              className="min-h-[80px]"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-red-50">T</Badge>
              <Label>Temporal (Time-bound) *</Label>
            </div>
            <Input
              type="date"
              value={formData.timeBound}
              onChange={(e) => setFormData(prev => ({ ...prev, timeBound: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ¿Cuál es la fecha límite para lograr este objetivo?
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          Guardar Objetivo
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
