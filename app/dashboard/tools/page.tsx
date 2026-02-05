'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHTS = [20, 15, 10];
const MAX_PLATE_OPTIONS = [25, 20, 15, 10];

interface PlateResult {
  plate: number;
  count: number;
}

function calculatePlates(targetWeight: number, barWeight: number, maxPlate: number): PlateResult[] {
  const weightPerSide = (targetWeight - barWeight) / 2;

  if (weightPerSide <= 0) return [];

  const availablePlates = AVAILABLE_PLATES.filter(p => p <= maxPlate);
  const result: PlateResult[] = [];
  let remaining = weightPerSide;

  for (const plate of availablePlates) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      result.push({ plate, count });
      remaining = remaining - (count * plate);
    }
  }

  return result;
}

function PlateVisual({ plates, side }: { plates: PlateResult[]; side: 'left' | 'right' }) {
  const plateColors: Record<number, string> = {
    25: 'bg-red-500',
    20: 'bg-blue-500',
    15: 'bg-yellow-400',
    10: 'bg-green-500',
    5: 'bg-white border-2 border-gray-300',
    2.5: 'bg-gray-400',
    1.25: 'bg-gray-300',
  };

  const plateHeights: Record<number, string> = {
    25: 'h-20',
    20: 'h-18',
    15: 'h-16',
    10: 'h-14',
    5: 'h-12',
    2.5: 'h-10',
    1.25: 'h-8',
  };

  const allPlates: number[] = [];
  plates.forEach(({ plate, count }) => {
    for (let i = 0; i < count; i++) {
      allPlates.push(plate);
    }
  });

  if (side === 'right') {
    allPlates.reverse();
  }

  return (
    <div className={`flex items-center gap-0.5 ${side === 'left' ? 'flex-row-reverse' : ''}`}>
      {allPlates.map((plate, idx) => (
        <div
          key={`${plate}-${idx}`}
          className={`${plateColors[plate]} ${plateHeights[plate]} w-3 rounded-sm flex items-center justify-center`}
          title={`${plate}kg`}
        >
          <span className="text-[8px] font-bold rotate-90 text-black/70">{plate}</span>
        </div>
      ))}
    </div>
  );
}

export default function ToolsPage() {
  const [targetWeight, setTargetWeight] = useState<string>('100');
  const [barWeight, setBarWeight] = useState<number>(20);
  const [maxPlate, setMaxPlate] = useState<number>(25);

  const weight = parseFloat(targetWeight) || 0;
  const plates = calculatePlates(weight, barWeight, maxPlate);
  const totalPlateWeight = plates.reduce((sum, p) => sum + (p.plate * p.count * 2), 0);
  const achievableWeight = barWeight + totalPlateWeight;
  const isExact = achievableWeight === weight;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Outils</h1>
        <p className="text-sm text-muted-foreground">
          Calculateurs et outils pratiques
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Plate Calculator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-destructive font-medium">Poids cible (kg)</Label>
              <Input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="100"
                min="0"
                step="2.5"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-destructive font-medium">Barre</Label>
              <div className="flex gap-1">
                {BAR_WEIGHTS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setBarWeight(w)}
                    className={`flex-1 px-2 py-2 text-sm rounded-lg border transition-colors ${
                      barWeight === w
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {w}kg
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-destructive font-medium">Disque max</Label>
              <div className="flex gap-1">
                {MAX_PLATE_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMaxPlate(p)}
                    className={`flex-1 px-2 py-2 text-sm rounded-lg border transition-colors ${
                      maxPlate === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {weight > barWeight && (
            <>
              <div className="flex items-center justify-center gap-1 py-4 bg-muted/30 rounded-lg overflow-x-auto">
                <PlateVisual plates={plates} side="left" />
                <div className="w-32 h-3 bg-gray-500 rounded-full mx-1" />
                <PlateVisual plates={plates} side="right" />
              </div>

              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{achievableWeight} kg</p>
                  {!isExact && (
                    <p className="text-xs text-muted-foreground">
                      (cible: {weight}kg - différence: {Math.abs(weight - achievableWeight).toFixed(2)}kg)
                    </p>
                  )}
                </div>

                <div className="border rounded-lg divide-y">
                  <div className="px-4 py-2 bg-muted/50 flex justify-between text-sm font-medium">
                    <span>Disque</span>
                    <span>Par côté</span>
                  </div>
                  {plates.length > 0 ? (
                    plates.map(({ plate, count }) => (
                      <div key={plate} className="px-4 py-2 flex justify-between text-sm">
                        <span className="font-medium">{plate} kg</span>
                        <span className="text-muted-foreground">× {count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                      Juste la barre
                    </div>
                  )}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Barre: {barWeight}kg + Disques: {totalPlateWeight}kg
                </p>
              </div>
            </>
          )}

          {weight > 0 && weight <= barWeight && (
            <div className="text-center py-6 text-muted-foreground">
              <p>Le poids cible est inférieur ou égal au poids de la barre ({barWeight}kg)</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
