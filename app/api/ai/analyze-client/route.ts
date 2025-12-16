import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const {
      clientName,
      totalSessions,
      completedGoals,
      pendingGoals,
      recentSessionNotes,
      coachingType,
      coachingMethod
    } = await req.json();

    if (!clientName) {
      return NextResponse.json(
        { error: 'Missing required field: clientName' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your OPENAI_API_KEY to the .env file.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Eres un coach profesional experto analizando el progreso de un cliente. Genera un análisis detallado y accionable basado en la siguiente información:

**Cliente:** ${clientName}
**Total de sesiones:** ${totalSessions || 0}
**Objetivos completados:** ${completedGoals || 0}
**Objetivos pendientes:** ${pendingGoals || 0}
${coachingType ? `**Tipo de coaching:** ${coachingType}` : ''}
${coachingMethod ? `**Metodología:** ${coachingMethod}` : ''}

${recentSessionNotes && recentSessionNotes.length > 0 ? `
**Notas de sesiones recientes:**
${recentSessionNotes.map((note: string, index: number) => `
Sesión ${index + 1}:
${note}
`).join('\n')}
` : ''}

Por favor, genera un análisis estructurado en el siguiente formato:

## 📈 Áreas de Progreso Destacadas
[Identifica logros, avances y mejoras observadas]

## 🔍 Patrones Identificados
[Comportamientos recurrentes, tendencias y dinámicas importantes]

## 💡 Áreas de Oportunidad
[Aspectos donde el cliente puede mejorar o profundizar]

## 🎯 Recomendaciones de Coaching
[Sugerencias específicas para las próximas sesiones y enfoque]

## 📊 Evaluación General
[Valoración del progreso general y perspectivas futuras]

Sé específico, constructivo y orientado a la acción. Basar el análisis en evidencia observable.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const analysis = completion.choices[0].message.content;

    return NextResponse.json({
      analysis,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('Error analyzing client:', error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your configuration.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze client progress. Please try again.' },
      { status: 500 }
    );
  }
}
