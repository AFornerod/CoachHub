'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SessionsChartProps {
  data: Array<{
    month: string;
    completed: number;
    scheduled: number;
  }>;
}

export function SessionsChart({ data }: SessionsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesiones por Mes</CardTitle>
        <CardDescription>
          Comparación de sesiones completadas vs programadas en los últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#2563eb"
              strokeWidth={2}
              name="Completadas"
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="scheduled"
              stroke="#10b981"
              strokeWidth={2}
              name="Programadas"
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
