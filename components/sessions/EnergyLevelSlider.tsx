'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface EnergyLevelSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function EnergyLevelSlider({ label, value, onChange }: EnergyLevelSliderProps) {
  const getEnergyLabel = (level: number) => {
    if (level <= 2) return 'Muy bajo';
    if (level <= 4) return 'Bajo';
    if (level <= 6) return 'Medio';
    if (level <= 8) return 'Alto';
    return 'Muy alto';
  };

  const getEnergyColor = (level: number) => {
    if (level <= 3) return 'text-red-600';
    if (level <= 5) return 'text-yellow-600';
    if (level <= 7) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getEnergyColor(value)}`}>
            {value}
          </span>
          <span className="text-sm text-gray-600">/ 10</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <p className={`text-sm font-medium text-center ${getEnergyColor(value)}`}>
        {getEnergyLabel(value)}
      </p>
    </div>
  );
}
