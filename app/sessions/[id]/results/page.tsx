'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { SessionResultForm } from '@/components/sessions/SessionResultForm';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SessionResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<any>(null);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessionData() {
      const supabase = createClient();

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*, clients(name)')
        .eq('id', sessionId)
        .maybeSingle();

      const { data: resultData } = await supabase
        .from('session_results')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      setSession(sessionData);
      setSessionResult(resultData);
      setLoading(false);
    }

    loadSessionData();
  }, [sessionId]);

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

  const initialData = {
    ...session,
    ...sessionResult,
    what_worked_well: sessionResult?.what_worked_well,
    what_to_improve: sessionResult?.what_to_improve,
    action_items: sessionResult?.action_items || [],
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Resultados de Sesión</h1>
            <p className="text-slate-600 mt-1">
              {session.title} - {session.clients?.name}
            </p>
          </div>
        </div>

        <SessionResultForm
          sessionId={sessionId}
          initialData={initialData}
          onSave={() => router.back()}
        />
      </div>
    </DashboardLayout>
  );
}
