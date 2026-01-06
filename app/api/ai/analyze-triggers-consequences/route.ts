import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 DEBUG TRIGGERS - User authenticated:', user?.id, user?.email);
    
    if (authError || !user) {
      console.error('❌ DEBUG TRIGGERS - Auth error:', authError);
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientId } = body;

    console.log('🔍 DEBUG TRIGGERS - ClientId requested:', clientId);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId es requerido' },
        { status: 400 }
      );
    }

    // ✅ VERIFICAR SI EL USUARIO ES COACH O CLIENTE
    let hasAccess = false;
    let isCoach = false;

    // Verificar si es el propio cliente
    const { data: clientRecord, error: clientError } = await supabase
      .from('clients')
      .select('user_id')
      .eq('id', clientId)
      .single();

    console.log('🔍 DEBUG TRIGGERS - Client record:', clientRecord);
    console.log('🔍 DEBUG TRIGGERS - Client error:', clientError);

    if (clientRecord && clientRecord.user_id === user.id) {
      hasAccess = true;
      isCoach = false;
      console.log('✅ DEBUG TRIGGERS - Access granted: User is the client');
    }

    // Si no es el cliente, verificar si es su coach
    if (!hasAccess) {
      const { data: relationship, error: relError } = await supabase
        .from('coach_client_relationships')
        .select('id')
        .eq('coach_id', user.id)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single();

      console.log('🔍 DEBUG TRIGGERS - Relationship found:', relationship);
      console.log('🔍 DEBUG TRIGGERS - Relationship error:', relError);

      if (relationship) {
        hasAccess = true;
        isCoach = true;
        console.log('✅ DEBUG TRIGGERS - Access granted: User is the coach');
      }
    }

    if (!hasAccess) {
      console.error('❌ DEBUG TRIGGERS - Access denied. User:', user.id, 'ClientId:', clientId);
      return NextResponse.json(
        { error: 'No tienes acceso a este cliente' },
        { status: 403 }
      );
    }

    // Obtener sesiones del cliente con notas
    const { data: sessions } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false })
      .limit(10);

    console.log('🔍 DEBUG TRIGGERS - Sessions found:', sessions?.length || 0);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        triggers: [],
        consequences: [],
        insights: [],
        message: 'No hay suficientes sesiones completadas para analizar'
      });
    }

    // Análisis básico de triggers y consecuencias
	const triggers: string[] = [];
	const consequences: string[] = [];
    const insights = [
      {
        type: 'info',
        title: 'Análisis en desarrollo',
        description: 'El análisis de triggers y consecuencias está en desarrollo. Por ahora mostramos datos básicos de tus sesiones.'
      }
    ];

    // Contar sesiones con notas
    const sessionsWithCoachNotes = sessions.filter(s => s.coach_notes && s.coach_notes.trim() !== '');
    const sessionsWithClientNotes = sessions.filter(s => s.client_notes && s.client_notes.trim() !== '');
    
    if (sessionsWithCoachNotes.length > 0 || sessionsWithClientNotes.length > 0) {
      insights.push({
        type: 'info',
        title: `${sessionsWithCoachNotes.length + sessionsWithClientNotes.length} sesiones con notas`,
        description: 'Se encontraron sesiones con notas que pueden ser analizadas para identificar patrones de comportamiento.'
      });
    }

    // Ejemplo de triggers básicos (esto debería ser más sofisticado con IA)
    if (sessions.length >= 3) {
      triggers.push({
        id: 'trigger_1',
        name: 'Patrones de estrés',
        frequency: Math.min(sessions.length, 5),
        severity: 'medium',
        relatedSessions: sessions.slice(0, 3).map(s => s.id)
      });
    }

    console.log('✅ DEBUG TRIGGERS - Analysis completed successfully');

    return NextResponse.json({
      triggers,
      consequences,
      insights,
      sessionsAnalyzed: sessions.length,
      lastAnalyzed: new Date().toISOString(),
      userRole: isCoach ? 'coach' : 'client'
    });

  } catch (error) {
    console.error('❌ DEBUG TRIGGERS - Error analyzing triggers:', error);
    return NextResponse.json(
      { error: 'Error al analizar triggers y consecuencias' },
      { status: 500 }
    );
  }
}
