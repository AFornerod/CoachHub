'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Lock, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { CompetencyFramework, Competency } from '@/lib/types/database.types'

interface FrameworkWithCompetencies extends CompetencyFramework {
  competencies?: Competency[]
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<FrameworkWithCompetencies[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFramework, setEditingFramework] = useState<CompetencyFramework | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadFrameworks()
  }, [])

  async function loadFrameworks() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: frameworksData, error: frameworksError } = await supabase
        .from('competency_frameworks')
        .select('*')
        .order('created_at', { ascending: false })

      if (frameworksError) throw frameworksError

      const frameworksWithCompetencies = await Promise.all(
        (frameworksData || []).map(async (framework) => {
          const { data: competencies } = await supabase
            .from('competencies')
            .select('*')
            .eq('framework_id', framework.id)
            .order('order_index', { ascending: true })

          return {
            ...framework,
            competencies: competencies || []
          }
        })
      )

      setFrameworks(frameworksWithCompetencies)
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
    setEditingFramework(null)
    setFormData({ name: '', description: '', is_public: false })
    setDialogOpen(true)
  }

  function openEditDialog(framework: CompetencyFramework) {
    setEditingFramework(framework)
    setFormData({
      name: framework.name,
      description: framework.description,
      is_public: framework.is_public
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editingFramework) {
        const { error } = await supabase
          .from('competency_frameworks')
          .update({
            name: formData.name,
            description: formData.description,
            is_public: formData.is_public,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFramework.id)

        if (error) throw error

        toast({
          title: 'Framework actualizado',
          description: 'El framework se actualizó correctamente'
        })
      } else {
        const { error } = await supabase
          .from('competency_frameworks')
          .insert({
            name: formData.name,
            description: formData.description,
            is_public: formData.is_public,
            coach_id: user.id
          })

        if (error) throw error

        toast({
          title: 'Framework creado',
          description: 'El framework se creó correctamente'
        })
      }

      setDialogOpen(false)
      loadFrameworks()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este framework? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('competency_frameworks')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Framework eliminado',
        description: 'El framework se eliminó correctamente'
      })

      loadFrameworks()
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Frameworks de Competencias</h1>
          <p className="text-gray-600 mt-2">
            Gestiona frameworks para evaluar competencias de tus clientes
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Framework
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((framework) => (
          <Card key={framework.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {framework.name}
                    {framework.is_public ? (
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Público
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Privado
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {framework.description || 'Sin descripción'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {framework.competencies?.length || 0} competencias
                  </p>
                  {framework.competencies && framework.competencies.length > 0 && (
                    <div className="space-y-1">
                      {framework.competencies.slice(0, 3).map((comp) => (
                        <div key={comp.id} className="text-sm text-gray-700">
                          • {comp.name}
                        </div>
                      ))}
                      {framework.competencies.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{framework.competencies.length - 3} más
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/frameworks/${framework.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Gestionar
                  </Button>
                  {!framework.is_public && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(framework)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(framework.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {frameworks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tienes frameworks creados aún</p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Crear tu primer framework
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingFramework ? 'Editar Framework' : 'Nuevo Framework'}
              </DialogTitle>
              <DialogDescription>
                {editingFramework
                  ? 'Modifica la información del framework'
                  : 'Crea un nuevo framework de competencias'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Liderazgo Ejecutivo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el propósito de este framework..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <Label htmlFor="is_public" className="cursor-pointer">
                  Framework público (visible para todos los coaches)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingFramework ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
