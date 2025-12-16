'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AchievementCard } from '@/components/progress/AchievementCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trophy } from 'lucide-react';

export default function ClientProgressPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    achievementDate: new Date().toISOString().split('T')[0],
    category: 'win',
    significance: 'medium',
    impact: '',
  });

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    const supabase = createClient();
    const [clientRes, achievementsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('achievements').select('*').eq('client_id', clientId).order('achievement_date', { ascending: false })
    ]);

    setClient(clientRes.data);
    setAchievements(achievementsRes.data || []);
    setLoading(false);
  }

  async function handleAddAchievement() {
    const supabase = createClient();
    const { error } = await supabase.from('achievements').insert({
      client_id: clientId,
      ...newAchievement,
      achievement_date: newAchievement.achievementDate,
      celebrated: false,
    });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo agregar el logro', variant: 'destructive' });
    } else {
      toast({ title: 'Logro agregado', description: 'El logro se ha registrado correctamente' });
      setShowDialog(false);
      setNewAchievement({
        title: '',
        description: '',
        achievementDate: new Date().toISOString().split('T')[0],
        category: 'win',
        significance: 'medium',
        impact: '',
      });
      loadData();
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Progreso y Logros</h1>
            <p className="text-slate-600 mt-1">{client?.name}</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Logro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Logro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título del Logro</Label>
                  <Input
                    value={newAchievement.title}
                    onChange={(e) => setNewAchievement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Presentación exitosa ante la junta"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={newAchievement.description}
                    onChange={(e) => setNewAchievement(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe el logro..."
                  />
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={newAchievement.achievementDate}
                    onChange={(e) => setNewAchievement(prev => ({ ...prev, achievementDate: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={newAchievement.category}
                      onValueChange={(value) => setNewAchievement(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="win">Victoria</SelectItem>
                        <SelectItem value="breakthrough">Revelación</SelectItem>
                        <SelectItem value="milestone">Hito</SelectItem>
                        <SelectItem value="habit_formed">Hábito Formado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Importancia</Label>
                    <Select
                      value={newAchievement.significance}
                      onValueChange={(value) => setNewAchievement(prev => ({ ...prev, significance: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeño</SelectItem>
                        <SelectItem value="medium">Medio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                        <SelectItem value="transformational">Transformacional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Impacto</Label>
                  <Textarea
                    value={newAchievement.impact}
                    onChange={(e) => setNewAchievement(prev => ({ ...prev, impact: e.target.value }))}
                    placeholder="¿Qué impacto tuvo este logro?"
                  />
                </div>
                <Button onClick={handleAddAchievement} className="w-full">
                  Guardar Logro
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {achievements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Aún no hay logros registrados</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Primer Logro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logros Alcanzados ({achievements.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
