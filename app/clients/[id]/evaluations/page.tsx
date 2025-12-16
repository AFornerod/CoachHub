'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Calendar, FileText, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CompetencyRadarChart } from '@/components/evaluation/CompetencyRadarChart'
import type { Client, CompetencyEvaluation, CompetencyScore, Competency } from '@/lib/types/database.types'

interface EvaluationWithDetails extends CompetencyEvaluation {
  framework?: {
    name: string
  }
  scores?: Array<CompetencyScore & { competency: Competency }>
}

export default function ClientEvaluationsPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [evaluations, setEvaluations] = useState<EvaluationWithDetails[]>([])
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithDetails | null>(null)
  const [compareEvaluation, setCompareEvaluation] = useState<EvaluationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [params.id])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .eq('role', 'client')
        .maybeSingle()

      if (clientError) throw clientError
      if (!clientData) {
        toast({
          title: 'Error',
          description: 'Cliente no encontrado',
          variant: 'destructive'
        })
        router.push('/clients')
        return
      }

      setClient(clientData)

      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('competency_evaluations')
        .select(`
          *,
          framework:competency_frameworks(name)
        `)
        .eq('client_id', params.id)
        .order('evaluation_date', { ascending: false })

      if (evaluationsError) throw evaluationsError

      const evaluationsWithScores = await Promise.all(
        (evaluationsData || []).map(async (evaluation) => {
          const { data: scores } = await supabase
            .from('competency_scores')
            .select(`
              *,
              competency:competencies(*)
            `)
            .eq('evaluation_id', evaluation.id)
            .order('competency(order_index)', { ascending: true })

          return {
            ...evaluation,
            scores: scores || []
          }
        })
      )

      setEvaluations(evaluationsWithScores as EvaluationWithDetails[])

      if (evaluationsWithScores.length > 0) {
        setSelectedEvaluation(evaluationsWithScores[0] as EvaluationWithDetails)
        if (evaluationsWithScores.length > 1) {
          setCompareEvaluation(evaluationsWithScores[1] as EvaluationWithDetails)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  function getAverageScore(evaluation: EvaluationWithDetails): number {
    if (!evaluation.scores || evaluation.scores.length === 0) return 0
    const sum = evaluation.scores.reduce((acc, score) => acc + score.score, 0)
    return Math.round((sum / evaluation.scores.length) * 10) / 10
  }

  function getScoreChange(current: EvaluationWithDetails, previous: EvaluationWithDetails): number {
    const currentAvg = getAverageScore(current)
    const previousAvg = getAverageScore(previous)
    return Math.round((currentAvg - previousAvg) * 10) / 10
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  if (!client) return null

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push(`/clients/${params.id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Cliente
      </Button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Evaluaciones de Competencias</h1>
          <p className="text-gray-600 mt-2">{client.name}</p>
        </div>
        <Button onClick={() => router.push(`/clients/${params.id}/evaluations/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Evaluación
        </Button>
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              Este cliente no tiene evaluaciones de competencias
            </p>
            <Button onClick={() => router.push(`/clients/${params.id}/evaluations/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primera evaluación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="compare">Comparar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {selectedEvaluation && (
              <>
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Última Evaluación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {format(new Date(selectedEvaluation.evaluation_date), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedEvaluation.framework?.name}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Promedio Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {getAverageScore(selectedEvaluation)}/10
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedEvaluation.scores?.length || 0} competencias
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Progreso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {compareEvaluation ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">
                              {getScoreChange(selectedEvaluation, compareEvaluation) > 0 ? '+' : ''}
                              {getScoreChange(selectedEvaluation, compareEvaluation)}
                            </span>
                            <TrendingUp
                              className={`h-5 w-5 ${
                                getScoreChange(selectedEvaluation, compareEvaluation) > 0
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                              }`}
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            vs evaluación anterior
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">Primera evaluación</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Visualización de Competencias</CardTitle>
                    <CardDescription>
                      Resultados de la última evaluación
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedEvaluation.scores && selectedEvaluation.scores.length > 0 && (
                      <CompetencyRadarChart
                        data={selectedEvaluation.scores.map(score => ({
                          competencyName: score.competency.name,
                          score: score.score
                        }))}
                        compareData={
                          compareEvaluation?.scores
                            ? compareEvaluation.scores.map(score => ({
                                competencyName: score.competency.name,
                                score: score.score
                              }))
                            : undefined
                        }
                      />
                    )}
                  </CardContent>
                </Card>

                {selectedEvaluation.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notas de la Evaluación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{selectedEvaluation.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(evaluation.evaluation_date), 'dd MMM yyyy', { locale: es })}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {evaluation.framework?.name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      Promedio: {getAverageScore(evaluation)}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {evaluation.scores?.map((score) => (
                      <div key={score.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{score.competency.name}</span>
                        <span className="font-semibold">{score.score}/10</span>
                      </div>
                    ))}
                  </div>
                  {evaluation.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-gray-500" />
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {evaluation.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="compare" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparación de Evaluaciones</CardTitle>
                <CardDescription>
                  Compara dos evaluaciones para ver el progreso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Primera Evaluación
                    </label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={selectedEvaluation?.id || ''}
                      onChange={(e) => {
                        const evaluation = evaluations.find(ev => ev.id === e.target.value)
                        setSelectedEvaluation(evaluation || null)
                      }}
                    >
                      {evaluations.map((evaluation) => (
                        <option key={evaluation.id} value={evaluation.id}>
                          {format(new Date(evaluation.evaluation_date), 'dd MMM yyyy', { locale: es })} - {evaluation.framework?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Segunda Evaluación
                    </label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={compareEvaluation?.id || ''}
                      onChange={(e) => {
                        const evaluation = evaluations.find(ev => ev.id === e.target.value)
                        setCompareEvaluation(evaluation || null)
                      }}
                    >
                      <option value="">Ninguna</option>
                      {evaluations.map((evaluation) => (
                        <option key={evaluation.id} value={evaluation.id}>
                          {format(new Date(evaluation.evaluation_date), 'dd MMM yyyy', { locale: es })} - {evaluation.framework?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedEvaluation && selectedEvaluation.scores && selectedEvaluation.scores.length > 0 && (
                  <CompetencyRadarChart
                    data={selectedEvaluation.scores.map(score => ({
                      competencyName: score.competency.name,
                      score: score.score
                    }))}
                    compareData={
                      compareEvaluation?.scores
                        ? compareEvaluation.scores.map(score => ({
                            competencyName: score.competency.name,
                            score: score.score
                          }))
                        : undefined
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
