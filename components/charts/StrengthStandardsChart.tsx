'use client';

import { StrengthLevel } from '@/types/analytics';

interface StrengthStandardsChartProps {
  exercise: 'squat' | 'bench' | 'deadlift';
  currentWeight: number;
  standards: Record<StrengthLevel, number>;
  currentLevel: StrengthLevel;
}

export const levelColors: Record<StrengthLevel, string> = {
  untrained: 'bg-gray-400',
  novice: 'bg-green-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-purple-500',
  elite: 'bg-amber-500',
  international: 'bg-red-600',
};

export const levelLabels: Record<StrengthLevel, string> = {
  untrained: 'Débutant',
  novice: 'Novice',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  elite: 'Élite',
  international: 'International',
};

// Determine which visual segment the weight falls in
// Segment for level X covers [standards[prev_level], standards[X])
function getVisualLevel(weight: number, standards: Record<StrengthLevel, number>): StrengthLevel {
  const levels: StrengthLevel[] = ['untrained', 'novice', 'intermediate', 'advanced', 'elite', 'international'];
  for (let i = levels.length - 1; i >= 0; i--) {
    const segStart = i === 0 ? 0 : standards[levels[i - 1]];
    if (weight >= segStart) return levels[i];
  }
  return 'untrained';
}

export function StrengthStandardsChart({
  exercise,
  currentWeight,
  standards,
}: StrengthStandardsChartProps) {
  const maxStandard = standards.international;
  const levels: StrengthLevel[] = ['untrained', 'novice', 'intermediate', 'advanced', 'elite', 'international'];

  const exerciseLabels = {
    squat: 'Squat',
    bench: 'Bench',
    deadlift: 'Deadlift',
  };

  const visualLevel = getVisualLevel(currentWeight, standards);
  const currentLevelIndex = levels.indexOf(visualLevel);
  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{exerciseLabels[exercise]}</span>
        <span className="text-xs text-muted-foreground">
          Niveau: <span className={`font-medium ${visualLevel === 'international' ? 'text-red-600' : 'text-foreground'}`}>{levelLabels[visualLevel]}</span>
        </span>
      </div>

      <div className="relative h-8 bg-muted rounded-full overflow-hidden">
        {levels.map((level, index) => {
          const prevValue = index === 0 ? 0 : standards[levels[index - 1]];
          const currentValue = standards[level];
          const startPercent = (prevValue / maxStandard) * 100;
          const widthPercent = ((currentValue - prevValue) / maxStandard) * 100;

          return (
            <div
              key={level}
              className={`absolute h-full ${levelColors[level]} opacity-60`}
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
              }}
            />
          );
        })}

        <div
          className="absolute top-0 h-full w-1 bg-destructive z-10"
          style={{
            left: `${Math.min((currentWeight / maxStandard) * 100, 100)}%`,
            transform: 'translateX(-50%)',
          }}
        />

        <div
          className="absolute -top-1 z-20"
          style={{
            left: `${Math.min((currentWeight / maxStandard) * 100, 100)}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-3 h-3 rounded-full bg-destructive border-2 border-background" />
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        {levels.map((level) => (
          <div key={level} className="text-center flex-1">
            <div className={`w-2 h-2 rounded-full ${levelColors[level]} mx-auto mb-1`} />
            <span className="text-[10px]">{standards[level]}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <span className="text-sm">
          Ton PR: <span className="font-bold text-primary">{currentWeight} kg</span>
        </span>
        {nextLevel && (
          <span className="text-xs text-muted-foreground ml-2">
            (prochain: {standards[visualLevel]} kg)
          </span>
        )}
      </div>
    </div>
  );
}
