'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { PlanWizard } from '@/components/coaching-plan/PlanWizard';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewCoachingPlanPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClient() {
      const supabase = createClient();
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      setClient(data);
      setLoading(false);
    }
    loadClient();
  }, [clientId]);

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Crear Plan de Coaching</h1>
            <p className="text-slate-600 mt-1">Para {client?.name}</p>
          </div>
        </div>

        <PlanWizard
          clientId={clientId}
          clientName={client?.name}
          onComplete={(planId) => router.push(`/clients/${clientId}/coaching-plan/${planId}`)}
        />
      </div>
    </DashboardLayout>
  );
}
