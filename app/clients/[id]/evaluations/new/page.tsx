'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { CompetencyEvaluationForm } from '@/components/evaluation/CompetencyEvaluationForm'
import type { Client, CompetencyFramework, Competency } from '@/lib/types/database.types'

export default function NewEvaluationPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [frameworks, setFrameworks] = useState<CompetencyFramework[]>([])
  const [selectedFramework, setSelectedFramework] = useState<string>('')
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const supabase = createClient()
const rawId = params?.id
const clientId = Array.isArray(rawId) ? rawId[0] : rawId


  useEffect(() => {
    loadData()
  }, [params.id])

  useEffect(() => {
    if (selectedFramework) {
      loadCompetencies(selectedFramework)
    }
  }, [selectedFramework])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)        
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

      const { data: frameworksData, error: frameworksError } = await supabase
        .from('competency_frameworks')
        .select('*')
        .order('name', { ascending: true })

      if (frameworksError) throw frameworksError

      setFrameworks(frameworksData || [])
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

  async function loadCompetencies(frameworkId: string) {
    try {
      const { data: competenciesData, error } = await supabase
        .from('competencies')
        .select('*')
        .eq('framework_id', frameworkId)
        .order('order_index', { ascending: true })

      if (error) throw error

      setCompetencies(competenciesData || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  function handleComplete() {
    	router.push(`/clients/${clientId}/evaluations`)
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push(`/clients/${clientId}/evaluations`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Evaluaciones
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nueva Evaluación de Competencias</h1>
        <p className="text-gray-600 mt-2">Cliente: {(client as any).full_name} </p>
      </div>

      {!selectedFramework ? (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona un Framework</CardTitle>
            <CardDescription>
              Elige el framework de competencias que deseas utilizar para esta evaluación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="framework">Framework de Competencias</Label>
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Selecciona un framework..." />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((framework) => (
                    <SelectItem key={framework.id} value={framework.id}>
                      {framework.name}
                      {framework.is_public && ' (Público)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {frameworks.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">
                  No tienes frameworks disponibles
                </p>
                <Button onClick={() => router.push('/frameworks')}>
                  Crear Framework
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {frameworks.find(f => f.id === selectedFramework)?.name}
                    </CardTitle>
                    <CardDescription>
                      {frameworks.find(f => f.id === selectedFramework)?.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFramework('')
                      setCompetencies([])
                    }}
                  >
                    Cambiar Framework
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>

          {competencies.length > 0 ? (
            <CompetencyEvaluationForm
              competencies={competencies}
              clientId={params.id as string}
              frameworkId={selectedFramework}
              onComplete={handleComplete}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">
                  Este framework no tiene competencias configuradas
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/frameworks/${selectedFramework}`)}
                >
                  Configurar Competencias
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
