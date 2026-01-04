'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Edit,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Heart,
  Star,
  Zap,
  Brain,
} from 'lucide-react';
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  scheduled_date: string;
  duration: number;
  status: string;
  session_number: number;
  
  // Información básica
  notes: string;
  session_focus: string[];
  session_type: string;
  
  // Estado emocional
  pre_session_mood: string;
  post_session_mood: string;
  energy_level_start: number;
  energy_level_end: number;
  
  // Contenido de la sesión
  techniques_used: string[];
  insights: string[];
  breakthrough_moments: string[];
  challenges_discussed: string[];
  
  // Acciones y compromisos
  homework_assigned: string[];
  
  // Observaciones
  coach_observations: string;
  ai_summary: string;
  
  // Próxima sesión
  next_session_focus: string;
  
  // Cliente
  client_notes: string;
  client_reflection: string;
  session_rating: number | null;
  session_feedback: string;
  
  clients: {
    full_name: string;
    email: string;
  };
}

export default function SessionResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    const supabase = createClient();

    console.log('📊 Loading session results:', sessionId);

    const { data, error } = await supabase
      .from('sessions')
      .select('*, clients(full_name, email)')
      .eq('id', sessionId)
      .maybeSingle();

    console.log('📊 Session data:', data);
    console.log('❌ Session error:', error);

    if (error) {
      console.error('Error loading session:', error);
    } else {
      setSession(data);
    }

    setLoading(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'scheduled':
        return 'Programada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
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

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Sesión no encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/sessions">Volver a Sesiones</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Resultados de la Sesión</h1>
              <p className="text-slate-600 mt-1">
                {session.title} - {session.clients?.full_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(session.status)}>
              {getStatusLabel(session.status)}
            </Badge>
            <Button variant="outline" asChild>
              <Link href={`/sessions/${session.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          </div>
        </div>

        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Fecha</p>
                  <p className="font-medium">
                    {format(parseISO(session.scheduled_date), "dd 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Hora y Duración</p>
                  <p className="font-medium">
                    {format(parseISO(session.scheduled_date), 'HH:mm', { locale: es })} -{' '}
                    {session.duration} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Sesión</p>
                  <p className="font-medium">#{session.session_number || 'N/A'}</p>
                </div>
              </div>
            </div>

            {session.session_focus && session.session_focus.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Enfoque de la Sesión
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {session.session_focus.map((focus, index) => (
                      <Badge key={index} variant="secondary">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Estado Emocional */}
        {(session.pre_session_mood || session.post_session_mood || session.energy_level_start || session.energy_level_end) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Estado Emocional y Energía
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mood */}
                {(session.pre_session_mood || session.post_session_mood) && (
                  <div>
                    <h4 className="font-semibold mb-3">Estado de Ánimo</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {session.pre_session_mood && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Inicio</p>
                          <Badge variant="outline" className="text-base">
                            {session.pre_session_mood}
                          </Badge>
                        </div>
                      )}
                      {session.post_session_mood && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Final</p>
                          <Badge variant="outline" className="text-base">
                            {session.post_session_mood}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Energy */}
                {(session.energy_level_start || session.energy_level_end) && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Nivel de Energía
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {session.energy_level_start && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Inicio</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {session.energy_level_start}/10
                          </p>
                        </div>
                      )}
                      {session.energy_level_end && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Final</p>
                          <p className="text-3xl font-bold text-green-600">
                            {session.energy_level_end}/10
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Técnicas Utilizadas */}
        {session.techniques_used && session.techniques_used.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Técnicas Utilizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {session.techniques_used.map((technique, index) => (
                  <Badge key={index} variant="outline" className="text-base">
                    {technique}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        {session.insights && session.insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Insights Clave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {session.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Momentos de Avance */}
        {session.breakthrough_moments && session.breakthrough_moments.length > 0 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Momentos de Avance
              </CardTitle>
              <CardDescription>Logros significativos durante la sesión</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {session.breakthrough_moments.map((moment, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{moment}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Desafíos Discutidos */}
        {session.challenges_discussed && session.challenges_discussed.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Desafíos Discutidos
              </CardTitle>
              <CardDescription>Áreas que requieren atención</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {session.challenges_discussed.map((challenge, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{challenge}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Acciones y Compromisos */}
        {session.homework_assigned && session.homework_assigned.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Acciones y Compromisos
              </CardTitle>
              <CardDescription>Tareas para realizar antes de la próxima sesión</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {session.homework_assigned.map((homework, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded border-2 border-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{homework}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Observaciones del Coach */}
        {session.coach_observations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observaciones del Coach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{session.coach_observations}</p>
            </CardContent>
          </Card>
        )}

        {/* Notas del Coach */}
        {session.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notas del Coach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{session.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Próxima Sesión */}
        {session.next_session_focus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Enfoque para la Próxima Sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{session.next_session_focus}</p>
            </CardContent>
          </Card>
        )}

        {/* Notas del Cliente */}
        {(session.client_notes || session.client_reflection || session.session_rating || session.session_feedback) && (
          <Card className="border-2 border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Heart className="h-5 w-5 text-purple-600" />
                Feedback del Cliente
              </CardTitle>
              <CardDescription>Lo que el cliente compartió sobre la sesión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {session.client_notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <Label className="text-purple-900 font-semibold">Notas Personales</Label>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{session.client_notes}</p>
                  </div>
                </div>
              )}

              {session.client_reflection && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <Label className="text-purple-900 font-semibold">Reflexión</Label>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{session.client_reflection}</p>
                  </div>
                </div>
              )}

              {session.session_rating && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-600" />
                    <Label className="text-purple-900 font-semibold">Calificación</Label>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= (session.session_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {session.session_feedback && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <Label className="text-purple-900 font-semibold">Comentarios</Label>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{session.session_feedback}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumen AI */}
        {session.ai_summary && (
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Brain className="h-5 w-5 text-indigo-600" />
                Resumen AI
              </CardTitle>
              <CardDescription>Análisis generado automáticamente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{session.ai_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Botón Volver */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" asChild>
            <Link href="/sessions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Sesiones
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
