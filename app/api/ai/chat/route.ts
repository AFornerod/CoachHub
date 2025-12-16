import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { messages, coachContext } = await req.json();

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your OPENAI_API_KEY to the .env file.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `Eres un asistente especializado para coaches profesionales usando CoachHub.
${coachContext?.method ? `El coach usa la metodología ${coachContext.method}` : ''}
${coachContext?.type ? `y se especializa en ${coachContext.type}.` : ''}

Tu misión es ayudar con:
- Gestión y organización de clientes
- Sugerencias de objetivos según tipo de coaching
- Planificación y seguimiento de sesiones
- Estrategias de seguimiento de clientes
- Mejores prácticas de coaching profesional
- Análisis de progreso de clientes
- Ideas para planes de acción efectivos

Sé conciso, profesional, práctico y empático. Proporciona respuestas accionables.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0].message;

    return NextResponse.json({
      message: assistantMessage,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('Error in AI chat:', error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your configuration.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request. Please try again.' },
      { status: 500 }
    );
  }
}
