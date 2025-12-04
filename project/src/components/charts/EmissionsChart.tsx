import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useEmissionUnit } from '../../context/EmissionUnitContext';

interface EmissionsChartProps {
  concreteVolume: number;
  cltVolume: number;
  steelVolume: number;
}

// Custom Bar with 3D hover effect
const Custom3DBar = (props: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const { fill, x, y, width, height } = props;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transition: 'transform 0.3s ease-out',
        transform: isHovered ? 'translateZ(20px) scale(1.05)' : 'translateZ(0) scale(1)',
        transformOrigin: 'center',
        cursor: 'pointer'
      }}
    >
      <defs>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={4}
        ry={4}
        style={{
          filter: isHovered ? 'url(#shadow)' : 'none',
          transition: 'all 0.3s ease-out',
        }}
      />
    </g>
  );
};

// Custom Tooltip with glass effect and 3D
const CustomTooltip = ({ active, payload, label, coordinate }: any) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="glass-card p-3 shadow-glass-md border border-white/50 absolute pointer-events-none"
        style={{
          transform: `translateX(-50%) translateZ(30px)`,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          minWidth: '200px',
          left: coordinate?.x,
          top: coordinate?.y - 120,
          perspective: '1000px',
          transition: 'transform 0.3s ease-out',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        <p className="font-semibold text-secondary-900 mb-2 transform hover:scale-105 transition-transform">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p 
            key={index} 
            className="text-sm mb-1 flex justify-between items-center transform hover:translate-x-1 transition-transform" 
            style={{ color: entry.color }}
          >
            <span>{entry.name}:</span>
            <span className="font-medium">{entry.value.toFixed(2)} {entry.name.includes('Volume') ? 'm³' : ''}</span>
          </p>
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
      fill: '#94a3b8'
    },
    {
      name: 'CLT',
      volume: cltVolume,
      emissions: cltVolume * CLT_FACTOR,
      fill: '#65a30d'
    },
    {
      name: 'Steel',
      volume: steelVolume,
      emissions: steelVolume * STEEL_FACTOR,
      fill: '#a16207'
    }
  ];

  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <div className="relative transform-gpu" style={{ perspective: '1000px' }}>
      <h3 className="text-lg font-semibold text-secondary-900 mb-4 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent transform hover:scale-105 transition-transform">
        Emission Analysis
      </h3>
      <div className="relative hover:shadow-xl transition-shadow rounded-lg p-4" style={{ height: '320px', width: '100%' }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fca5a5" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#86efac" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#86efac', opacity: 0.5 }}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }} 
              tickFormatter={formatYAxis}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#86efac', opacity: 0.5 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              label={{ value: `Emissions (${label})`, angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280' } }} 
              tickFormatter={formatYAxis}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#86efac', opacity: 0.5 }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              position={{ y: 0 }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '14px',
                color: '#6b7280'
              }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="volume" 
              name="Volume (m³)" 
              fill="url(#volumeGradient)" 
              shape={<Custom3DBar />}
              stroke="#16a34a"
              strokeWidth={1}
            />
            <Bar 
              yAxisId="right" 
              dataKey="emissions" 
              name={`Emissions (${label})`} 
              fill="url(#emissionsGradient)" 
              shape={<Custom3DBar />}
              stroke="#dc2626"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EmissionsChart;