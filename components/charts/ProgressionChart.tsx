'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DataPoint {
  date: Date;
  weight: number;
  reps: number;
  estimatedMax: number;
}

interface ProgressionChartProps {
  data: DataPoint[];
  showEstimated?: boolean;
  targetWeight?: number;
}

export function ProgressionChart({
  data,
  showEstimated = true,
  targetWeight,
}: ProgressionChartProps) {
  const chartData = data.map((point) => ({
    date: format(point.date, 'dd MMM', { locale: fr }),
    fullDate: format(point.date, 'dd MMMM yyyy', { locale: fr }),
    weight: point.weight,
    reps: point.reps,
    estimatedMax: point.estimatedMax,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.weight, showEstimated ? d.estimatedMax : 0))
  );
  const minValue = Math.min(...data.map((d) => d.weight));
  const padding = Math.max(10, (maxValue - minValue) * 0.1);
  const yDomain = [Math.floor(minValue - padding), Math.ceil(maxValue + padding)];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            padding: '8px 12px',
            fontSize: '12px',
          }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload;
              return (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  padding: '8px 12px',
                  fontSize: '12px',
                }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>{d.fullDate}</p>
                  <p style={{ color: '#dc2626' }}>
                    PR: {d.weight} kg × {d.reps} rep{d.reps > 1 ? 's' : ''}
                  </p>
                  {showEstimated && d.estimatedMax > d.weight && (
                    <p style={{ color: '#ea580c' }}>1RM estimé: {d.estimatedMax} kg</p>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        {targetWeight && (
          <ReferenceLine
            y={targetWeight}
            stroke="#9ca3af"
            strokeDasharray="5 5"
            label={{
              value: `Objectif: ${targetWeight}kg`,
              position: 'right',
              fontSize: 10,
              fill: '#9ca3af',
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#dc2626"
          strokeWidth={2}
          dot={{ fill: '#dc2626', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: '#dc2626' }}
          name="PR réel"
          connectNulls
        />
        {showEstimated && (
          <Line
            type="monotone"
            dataKey="estimatedMax"
            stroke="#ea580c"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#ea580c', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#ea580c' }}
            name="1RM estimé"
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
