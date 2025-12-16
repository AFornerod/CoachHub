'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Edit, Trash2, ArrowLeft, MoveUp, MoveDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { CompetencyFramework, Competency } from '@/lib/types/database.types'

export default function FrameworkDetailPage() {
  const [framework, setFramework] = useState<CompetencyFramework | null>(null)
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadFrameworkData()
  }, [params.id])

  async function loadFrameworkData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: frameworkData, error: frameworkError } = await supabase
        .from('competency_frameworks')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()

      if (frameworkError) throw frameworkError
      if (!frameworkData) {
        toast({
          title: 'Error',
          description: 'Framework no encontrado',
          variant: 'destructive'
        })
        router.push('/frameworks')
        return
      }

      setFramework(frameworkData)

      const { data: competenciesData, error: competenciesError } = await supabase
        .from('competencies')
        .select('*')
        .eq('framework_id', params.id)
        .order('order_index', { ascending: true })

      if (competenciesError) throw competenciesError

      setCompetencies(competenciesData || [])
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

  function openCreateDialog() {
    setEditingCompetency(null)
    setFormData({ name: '', description: '' })
    setDialogOpen(true)
  }

  function openEditDialog(competency: Competency) {
    setEditingCompetency(competency)
    setFormData({
      name: competency.name,
      description: competency.description
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingCompetency) {
        const { error } = await supabase
          .from('competencies')
          .update({
            name: formData.name,
            description: formData.description
          })
          .eq('id', editingCompetency.id)

        if (error) throw error

        toast({
          title: 'Competencia actualizada',
          description: 'La competencia se actualizó correctamente'
        })
      } else {
        const maxOrder = competencies.length > 0
          ? Math.max(...competencies.map(c => c.order_index))
          : -1

        const { error } = await supabase
          .from('competencies')
          .insert({
            framework_id: params.id as string,
            name: formData.name,
            description: formData.description,
            order_index: maxOrder + 1
          })

        if (error) throw error

        toast({
          title: 'Competencia creada',
          description: 'La competencia se creó correctamente'
        })
      }

      setDialogOpen(false)
      loadFrameworkData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta competencia?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('competencies')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Competencia eliminada',
        description: 'La competencia se eliminó correctamente'
      })

      loadFrameworkData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  async function moveCompetency(index: number, direction: 'up' | 'down') {
    const newCompetencies = [...competencies]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newCompetencies.length) return

    ;[newCompetencies[index], newCompetencies[targetIndex]] = [
      newCompetencies[targetIndex],
      newCompetencies[index]
    ]

    try {
      await Promise.all(
        newCompetencies.map((comp, idx) =>
          supabase
            .from('competencies')
            .update({ order_index: idx })
            .eq('id', comp.id)
        )
      )

      setCompetencies(newCompetencies)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  if (!framework) return null

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/frameworks')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Frameworks
      </Button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{framework.name}</h1>
          <p className="text-gray-600 mt-2">{framework.description}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Competencia
        </Button>
      </div>

      <div className="space-y-4">
        {competencies.map((competency, index) => (
          <Card key={competency.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{competency.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {competency.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveCompetency(index, 'up')}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveCompetency(index, 'down')}
                    disabled={index === competencies.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(competency)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(competency.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {competencies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No hay competencias en este framework</p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar primera competencia
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCompetency ? 'Editar Competencia' : 'Nueva Competencia'}
              </DialogTitle>
              <DialogDescription>
                {editingCompetency
                  ? 'Modifica la información de la competencia'
                  : 'Agrega una nueva competencia al framework'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Pensamiento Estratégico"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe qué mide esta competencia..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCompetency ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
