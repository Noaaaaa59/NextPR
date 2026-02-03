'use client';

import { Crown } from 'lucide-react';

interface PodiumEntry {
  displayName: string;
  value: number;
  photoURL?: string;
}

interface PodiumProps {
  title: string;
  icon: React.ReactNode;
  entries: [PodiumEntry | null, PodiumEntry | null, PodiumEntry | null];
  unit?: string;
}

function PodiumStep({
  entry,
  rank,
  height,
}: {
  entry: PodiumEntry | null;
  rank: 1 | 2 | 3;
  height: number;
}) {
  const colors = {
    1: { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-900' },
    2: { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-700' },
    3: { bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-amber-100' },
  };

  const style = colors[rank];

  return (
    <div className="flex flex-col items-center" style={{ width: rank === 1 ? '40%' : '30%' }}>
      {entry ? (
        <>
          {rank === 1 && (
            <Crown className="h-6 w-6 text-amber-400 mb-1 drop-shadow-md" />
          )}
          <div className="text-center mb-2 min-h-[48px] flex flex-col justify-end">
            <p className="text-xs font-medium text-foreground truncate max-w-[80px]">
              {entry.displayName || 'Anonyme'}
            </p>
            <p className="text-sm font-bold text-destructive">
              {entry.value} kg
            </p>
          </div>
        </>
      ) : (
        <div className="min-h-[48px] mb-2 flex items-end">
          <p className="text-xs text-muted-foreground">—</p>
        </div>
      )}
      <div
        className={`w-full ${style.bg} ${style.border} border-2 rounded-t-lg flex items-center justify-center transition-all`}
        style={{ height: `${height}px` }}
      >
        <span className={`text-2xl font-bold ${style.text}`}>{rank}</span>
      </div>
    </div>
  );
}

export function Podium({ title, icon, entries, unit = 'kg' }: PodiumProps) {
  const [first, second, third] = entries;

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>

      <div className="flex items-end justify-center gap-1 pt-2">
        <PodiumStep entry={second} rank={2} height={60} />
        <PodiumStep entry={first} rank={1} height={80} />
        <PodiumStep entry={third} rank={3} height={45} />
      </div>

      <div className="mt-3 pt-2 border-t border-dashed">
        <div className="h-1 bg-muted rounded-full" />
      </div>
    </div>
  );
}

export function PodiumSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-muted" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
      <div className="flex items-end justify-center gap-1 pt-2">
        <div className="w-[30%] flex flex-col items-center">
          <div className="h-8 w-16 bg-muted rounded mb-2" />
          <div className="w-full h-[60px] bg-muted rounded-t-lg" />
        </div>
        <div className="w-[40%] flex flex-col items-center">
          <div className="h-8 w-16 bg-muted rounded mb-2" />
          <div className="w-full h-[80px] bg-muted rounded-t-lg" />
        </div>
        <div className="w-[30%] flex flex-col items-center">
          <div className="h-8 w-16 bg-muted rounded mb-2" />
          <div className="w-full h-[45px] bg-muted rounded-t-lg" />
        </div>
      </div>
    </div>
  );
}
