'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { Competency } from '@/lib/types/database.types'

interface CompetencyEvaluationFormProps {
  competencies: Competency[]
  clientId: string
  frameworkId: string
  onComplete: () => void
  existingScores?: { [competencyId: string]: { score: number; notes: string } }
  evaluationId?: string
}

export function CompetencyEvaluationForm({
  competencies,
  clientId,
  frameworkId,
  onComplete,
  existingScores = {},
  evaluationId
}: CompetencyEvaluationFormProps) {
  const [scores, setScores] = useState<{ [key: string]: number }>(
    Object.keys(existingScores).reduce((acc, key) => {
      acc[key] = existingScores[key].score
      return acc
    }, {} as { [key: string]: number })
  )
  const [notes, setNotes] = useState<{ [key: string]: string }>(
    Object.keys(existingScores).reduce((acc, key) => {
      acc[key] = existingScores[key].notes
      return acc
    }, {} as { [key: string]: string })
  )
  const [generalNotes, setGeneralNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleScoreChange = (competencyId: string, value: number[]) => {
    setScores({ ...scores, [competencyId]: value[0] })
  }

  const handleNotesChange = (competencyId: string, value: string) => {
    setNotes({ ...notes, [competencyId]: value })
  }

  const getScoreLabel = (score: number) => {
    if (score <= 2) return 'Muy bajo'
    if (score <= 4) return 'Bajo'
    if (score <= 6) return 'Medio'
    if (score <= 8) return 'Alto'
    return 'Muy alto'
  }

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-red-600'
    if (score <= 5) return 'text-orange-600'
    if (score <= 7) return 'text-yellow-600'
    if (score <= 8) return 'text-blue-600'
    return 'text-green-600'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let evalId = evaluationId

      if (!evalId) {
        const { data: evaluation, error: evalError } = await supabase
          .from('competency_evaluations')
          .insert({
            client_id: clientId,
            framework_id: frameworkId,
            coach_id: user.id,
            evaluation_date: new Date().toISOString().split('T')[0],
            notes: generalNotes
          })
          .select()
          .single()

        if (evalError) throw evalError
        evalId = evaluation.id
      } else {
        const { error: updateError } = await supabase
          .from('competency_evaluations')
          .update({
            notes: generalNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', evalId)

        if (updateError) throw updateError
      }

      const scoreInserts = competencies.map(competency => ({
        evaluation_id: evalId,
        competency_id: competency.id,
        score: scores[competency.id] || 5,
        notes: notes[competency.id] || ''
      }))

      if (evaluationId) {
        await supabase
          .from('competency_scores')
          .delete()
          .eq('evaluation_id', evalId)
      }

      const { error: scoresError } = await supabase
        .from('competency_scores')
        .insert(scoreInserts)

      if (scoresError) throw scoresError

      toast({
        title: 'Evaluación guardada',
        description: 'La evaluación se guardó correctamente'
      })

      onComplete()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const allScored = competencies.every(comp => scores[comp.id] !== undefined)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {competencies.map((competency, index) => {
          const score = scores[competency.id] || 5

          return (
            <Card key={competency.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {index + 1}. {competency.name}
                </CardTitle>
                <CardDescription>{competency.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Nivel de competencia</Label>
                    <span className={`font-semibold ${getScoreColor(score)}`}>
                      {score}/10 - {getScoreLabel(score)}
                    </span>
                  </div>
                  <Slider
                    value={[score]}
                    onValueChange={(value) => handleScoreChange(competency.id, value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 - Muy bajo</span>
                    <span>5 - Medio</span>
                    <span>10 - Muy alto</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`notes-${competency.id}`}>
                    Notas (opcional)
                  </Label>
                  <Textarea
                    id={`notes-${competency.id}`}
                    value={notes[competency.id] || ''}
                    onChange={(e) => handleNotesChange(competency.id, e.target.value)}
                    placeholder="Observaciones sobre esta competencia..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notas Generales</CardTitle>
          <CardDescription>
            Observaciones generales sobre esta evaluación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Comentarios generales, contexto de la evaluación, recomendaciones..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={!allScored || saving}
          size="lg"
        >
          {saving ? 'Guardando...' : evaluationId ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
        </Button>
      </div>
    </form>
  )
}
