'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  full_name: string;
}

interface SessionData {
  title: string;
  description: string;  // Se mapea a 'notes' en la base de datos
  scheduled_date: string;
  duration: number;
  status: string;
  session_type: string;
  client_id: string;
}

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<SessionData>({
    title: '',
    description: '',
    scheduled_date: '',
    duration: 60,
    status: 'scheduled',
    session_type: 'online',
    notes?: string;
    client_id: '',
  });

  useEffect(() => {
    loadData();
  }, [sessionId]);

  async function loadData() {
    const supabase = createClient();

    const [sessionResult, clientsResult] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle(),
      supabase.from('clients').select('id, full_name').order('full_name'),
    ]);

    if (sessionResult.error) {
      console.error('Error loading session:', sessionResult.error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la sesión',
        variant: 'destructive',
      });
      return;
    }

    if (!sessionResult.data) {
      toast({
        title: 'Error',
        description: 'Sesión no encontrada',
        variant: 'destructive',
      });
      router.push('/sessions');
      return;
    }

    if (clientsResult.data) {
      setClients(clientsResult.data);
    }

    const session = sessionResult.data;
    setFormData({
      title: session.title || '',
      description: session.notes || '',  // Mapear notes de la BD a description del form
      scheduled_date: session.scheduled_date
        ? new Date(session.scheduled_date).toISOString().slice(0, 16)
        : '',
      duration: session.duration || 60,
      status: session.status || 'scheduled',
      session_type: session.session_type || 'individual',
      client_id: session.client_id || '',
    });

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();

    const { error } = await supabase
      .from('sessions')
      .update({
        title: formData.title,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        duration: formData.duration,
        status: formData.status,
        session_type: formData.session_type,
        notes: formData.description,  // Usar description del form pero guardarlo en notes
        client_id: formData.client_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    setSaving(false);

    if (error) {
      console.error('Error updating session:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la sesión',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sesión actualizada',
      description: 'Los cambios se guardaron correctamente',
    });

    router.push(`/sessions/${sessionId}`);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Cargando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/sessions/${sessionId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Editar Sesión</h1>
            <p className="text-slate-600 mt-1">Modifica los detalles de la sesión</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Sesión de Desarrollo Personal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe el objetivo y contenido de la sesión"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Fecha y Hora *</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduled_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_type">Tipo de Sesión *</Label>
                  <Select
                    value={formData.session_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, session_type: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Grupal</SelectItem>
                      <SelectItem value="workshop">Taller</SelectItem>
                      <SelectItem value="assessment">Evaluación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Programada</SelectItem>
                      <SelectItem value="in-progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre la sesión"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/sessions/${sessionId}`)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
