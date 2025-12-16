'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const categoryIcons = {
  win: Trophy,
  breakthrough: Star,
  milestone: Target,
  habit_formed: TrendingUp,
};

const categoryColors = {
  win: 'bg-yellow-50 border-yellow-200',
  breakthrough: 'bg-purple-50 border-purple-200',
  milestone: 'bg-blue-50 border-blue-200',
  habit_formed: 'bg-green-50 border-green-200',
};

interface AchievementCardProps {
  achievement: {
    title: string;
    description: string;
    achievement_date: string;
    category: 'win' | 'breakthrough' | 'milestone' | 'habit_formed';
    significance: 'small' | 'medium' | 'large' | 'transformational';
    impact?: string;
    celebrated: boolean;
  };
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const Icon = categoryIcons[achievement.category] || Trophy;
  const colorClass = categoryColors[achievement.category];

  return (
    <Card className={`border-2 ${colorClass}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{achievement.title}</h4>
              <Badge variant="outline">{achievement.significance}</Badge>
              {achievement.celebrated && <span className="text-lg">🎉</span>}
            </div>
            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
            {achievement.impact && (
              <p className="text-sm text-gray-700 italic">Impacto: {achievement.impact}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {format(parseISO(achievement.achievement_date), 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
