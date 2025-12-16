import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { notes, clientName, sessionGoal, coachingType } = await req.json();

    if (!notes || !clientName) {
      return NextResponse.json(
        { error: 'Missing required fields: notes and clientName' },
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

    const prompt = `Eres un asistente experto en coaching profesional. Analiza estas notas de sesión y genera un resumen estructurado, profesional y accionable.

**Cliente:** ${clientName}
${sessionGoal ? `**Objetivo de la sesión:** ${sessionGoal}` : ''}
${coachingType ? `**Tipo de coaching:** ${coachingType}` : ''}

**Notas de la sesión:**
${notes}

Por favor, genera un resumen estructurado en el siguiente formato:

## 1. Objetivo de la Sesión
[Objetivo principal trabajado]

## 2. Temas Principales Tratados
[Lista de temas clave abordados durante la sesión]

## 3. Insights del Cliente
[Descubrimientos, reflexiones y revelaciones importantes del cliente]

## 4. Técnicas de Coaching Utilizadas
[Herramientas, preguntas poderosas o metodologías aplicadas]

## 5. Próximos Pasos Acordados
[Acciones concretas que el cliente se comprometió a realizar]

## 6. Recomendaciones para la Próxima Sesión
[Sugerencias sobre qué enfocarse en el siguiente encuentro]

Mantén un tono profesional, empático y orientado a la acción.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const summary = completion.choices[0].message.content;

    return NextResponse.json({
      summary,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('Error summarizing session:', error);

    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your configuration.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to summarize session. Please try again.' },
      { status: 500 }
    );
  }
}
