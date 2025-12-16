'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts'

interface CompetencyScore {
  competencyName: string
  score: number
  fullMark?: number
}

interface CompetencyRadarChartProps {
  data: CompetencyScore[]
  title?: string
  color?: string
  compareData?: CompetencyScore[]
  compareColor?: string
  compareLabel?: string
}

export function CompetencyRadarChart({
  data,
  title,
  color = '#3b82f6',
  compareData,
  compareColor = '#10b981',
  compareLabel = 'Evaluación previa'
}: CompetencyRadarChartProps) {
  const chartData = data.map((item, index) => {
    const baseData = {
      subject: item.competencyName.length > 20
        ? item.competencyName.substring(0, 20) + '...'
        : item.competencyName,
      fullName: item.competencyName,
      A: item.score,
      fullMark: 10
    }

    if (compareData && compareData[index]) {
      return {
        ...baseData,
        B: compareData[index].score
      }
    }

    return baseData
  })

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: '#666' }}
          />
          <Radar
            name="Evaluación actual"
            dataKey="A"
            stroke={color}
            fill={color}
            fillOpacity={0.6}
          />
          {compareData && (
            <Radar
              name={compareLabel}
              dataKey="B"
              stroke={compareColor}
              fill={compareColor}
              fillOpacity={0.3}
            />
          )}
          <Legend />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 shadow-lg rounded-lg border">
                    <p className="font-semibold mb-1">{payload[0]?.payload?.fullName}</p>
                    {payload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}/10
                      </p>
                    ))}
                  </div>
                )
              }
              return null
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
