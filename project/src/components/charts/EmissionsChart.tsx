import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useEmissionUnit } from '../../context/EmissionUnitContext';

interface EmissionsChartProps {
  concreteVolume: number;
  cltVolume: number;
  steelVolume: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-4 shadow-lg border border-primary-100/50 !bg-white/95 backdrop-blur-xl">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-slate-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
              {entry.name}:
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {entry.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              {entry.name.includes('Volume') ? ' m³' : ''}
            </span>
          </div>
        ))}
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
      color: '#059669' // Emerald-600 - Primary green
    },
    {
      name: 'CLT',
      volume: cltVolume,
      emissions: cltVolume * CLT_FACTOR,
      color: '#14b8a6' // Teal-500 - Nature accent
    },
    {
      name: 'Steel',
      volume: steelVolume,
      emissions: steelVolume * STEEL_FACTOR,
      color: '#84cc16' // Lime-500 - Leaf green
    }
  ];

  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        barSize={48}
      >
        <defs>
          {/* Gradient definitions for bars */}
          <linearGradient id="concreteGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="cltGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="steelGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a3e635" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#84cc16" stopOpacity={0.7} />
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
          tickFormatter={formatYAxis}
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
          cursor={{ fill: 'rgba(16, 185, 129, 0.05)', radius: 4 }}
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
          radius={[8, 8, 0, 0]}
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-volume-${index}`} 
              fill={`url(#${index === 0 ? 'concreteGradient' : index === 1 ? 'cltGradient' : 'steelGradient'})`}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.15))' }}
            />
          ))}
        </Bar>
        <Bar
          yAxisId="right"
          dataKey="emissions"
          name={`Emissions (${label})`}
          radius={[8, 8, 0, 0]}
          animationDuration={1500}
          animationBegin={300}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-emission-${index}`} 
              fill={entry.color}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))' }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EmissionsChart;
