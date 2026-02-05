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

// Custom dot component to render PRs with a star
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;

  if (!cx || !cy) return null;

  if (payload.isPR) {
    // PR point: gold circle with star
    return (
      <g>
        {/* Glow effect */}
        <circle cx={cx} cy={cy} r={8} fill="#fbbf24" opacity={0.3} />
        {/* Main dot */}
        <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="#fbbf24" strokeWidth={2} />
        {/* Star above */}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fill="#f59e0b"
          fontSize={12}
          fontWeight="bold"
        >
          ★
        </text>
      </g>
    );
  }

  // Regular point
  return <circle cx={cx} cy={cy} r={4} fill="#dc2626" />;
};

// Custom active dot for PRs
const CustomActiveDot = (props: any) => {
  const { cx, cy, payload } = props;

  if (!cx || !cy) return null;

  if (payload.isPR) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="#fbbf24" opacity={0.4} />
        <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fbbf24" strokeWidth={2} />
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fill="#f59e0b"
          fontSize={14}
          fontWeight="bold"
        >
          ★
        </text>
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={6} fill="#dc2626" />;
};

export function ProgressionChart({
  data,
  showEstimated = true,
  targetWeight,
}: ProgressionChartProps) {
  // Calculate which points are new PRs (higher than all previous)
  let maxWeightSoFar = 0;
  const chartData = data.map((point) => {
    const isPR = point.weight > maxWeightSoFar;
    if (isPR) {
      maxWeightSoFar = point.weight;
    }
    return {
      date: format(point.date, 'dd MMM', { locale: fr }),
      fullDate: format(point.date, 'dd MMMM yyyy', { locale: fr }),
      weight: point.weight,
      reps: point.reps,
      estimatedMax: point.estimatedMax,
      isPR,
    };
  });

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
  const yDomain = [Math.floor(minValue - padding), Math.ceil(maxValue + padding + 5)]; // Extra space for stars

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
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
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {d.fullDate}
                    {d.isPR && <span style={{ color: '#f59e0b', marginLeft: '6px' }}>★ Nouveau PR!</span>}
                  </p>
                  <p style={{ color: d.isPR ? '#f59e0b' : '#dc2626' }}>
                    {d.weight} kg × {d.reps} rep{d.reps > 1 ? 's' : ''}
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
          dot={<CustomDot />}
          activeDot={<CustomActiveDot />}
          name="Poids"
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
