import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useEmissionUnit } from '../../context/EmissionUnitContext';

interface EmissionsChartProps {
  concreteVolume: number;
  cltVolume: number;
  steelVolume: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { convert, label: unitLabel } = useEmissionUnit();

  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-2.5 shadow-lg border border-primary-100/50 !bg-white/95 backdrop-blur-xl min-w-[160px]">
        <p className="font-bold text-slate-800 mb-1.5 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => {
          const isVolume = entry.name.includes('Volume');
          const value = isVolume ? entry.value : convert(entry.value);
          const unit = isVolume ? ' m³' : ` ${unitLabel}`;

          return (
            <div key={index} className="flex items-center justify-between gap-3 mb-0.5">
              <span className="text-xs text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                {unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const EmissionsChart: React.FC<EmissionsChartProps> = ({
  concreteVolume,
  cltVolume,
  steelVolume
}) => {
  const { convert, label } = useEmissionUnit();
  // Constants for emission factors (kg CO₂e / m³)
  const CONCRETE_FACTOR = 300;
  const CLT_FACTOR = 250;
  const STEEL_FACTOR = 2000;

  const data = [
    {
      name: 'Concrete',
      volume: concreteVolume,
      emissions: concreteVolume * CONCRETE_FACTOR,
      color: '#64748b' // Slate-500 - Industrial
    },
    {
      name: 'CLT',
      volume: cltVolume,
      emissions: cltVolume * CLT_FACTOR,
      color: '#f59e0b' // Amber-500 - Wood/Warm
    },
    {
      name: 'Steel',
      volume: steelVolume,
      emissions: steelVolume * STEEL_FACTOR,
      color: '#3b82f6' // Blue-500 - Metal/Cool
    }
  ];

  const formatYAxis = (value: number): string => {
    const converted = convert(value);
    if (converted >= 1000) {
      return `${(converted / 1000).toFixed(1)}k`;
    }
    return converted.toString();
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        barSize={32}
        barGap={12}
      >
        <defs>
          {/* Gradient definitions for bars */}
          <linearGradient id="concreteGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#64748b" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="cltGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="steelGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 12 } }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={formatYAxis}
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          label={{ value: `Emissions (${label})`, angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 12 } }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(148, 163, 184, 0.1)', radius: 4 }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
          formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}
        />
        <Bar
          yAxisId="left"
          dataKey="volume"
          name="Volume (m³)"
          radius={[4, 4, 0, 0]}
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-volume-${index}`}
              fill={entry.color}
              fillOpacity={0.3}
              stroke={entry.color}
              strokeWidth={1}
              style={{ filter: `drop-shadow(0 2px 4px ${entry.color}20)` }}
            />
          ))}
        </Bar>
        <Bar
          yAxisId="right"
          dataKey="emissions"
          name={`Emissions (${label})`}
          radius={[4, 4, 0, 0]}
          animationDuration={1500}
          animationBegin={300}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-emission-${index}`}
              fill={`url(#${index === 0 ? 'concreteGradient' : index === 1 ? 'cltGradient' : 'steelGradient'})`}
              style={{ filter: `drop-shadow(0 4px 6px ${entry.color}40)` }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EmissionsChart;
