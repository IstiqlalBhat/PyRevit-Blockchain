import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import { AlertTriangle, Zap, TreePine, Car, Sparkles, Target, X } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useEmissionUnit } from '../context/EmissionUnitContext';
import { formatNumber as formatNum } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Stats {
  concreteVolume: number;
  cltVolume: number;
  steelVolume: number;
  totalEmissions: number;
}

interface ChartDataItem {
  name: string;
  emissions: number;
  volume: number;
  fill: string;
}

interface PieDataItem {
  name: string;
  value: number;
  fill: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

interface StatCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ComponentType<any>;
  gradient: string;
  delay: number;
}

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTarget: number;
  onSave: (newTarget: number) => void;
}

// Add this at the top level, outside any component
const DEFAULT_TARGET = 5000; // Default 5000 tCO₂e

// Update the TargetModal component first
const TargetModal: React.FC<TargetModalProps> = ({ isOpen, onClose, currentTarget, onSave }) => {
  const [targetValue, setTargetValue] = useState<string>(currentTarget.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetValue(currentTarget.toString());
  }, [currentTarget]);

  const handleSave = () => {
    const value = parseFloat(targetValue);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid positive number');
      return;
    }
    onSave(value);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTargetValue(value);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Set Emission Target</h3>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target Emissions (tCO₂e)
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={handleInputChange}
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="Enter target value"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Save Target
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Constants for emission factors (kg CO₂e / m³)
const CONCRETE_FACTOR = 300;
const CLT_FACTOR = 250;
const STEEL_FACTOR = 2000;

// Custom 3D Bar Component
const Custom3DBar = (props: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const { fill, x, y, width, height } = props;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        cursor: 'pointer',
      }}
    >
      <defs>
        <filter id={`shadow-${x}`}>
          <feDropShadow dx="0" dy={isHovered ? "8" : "4"} stdDeviation={isHovered ? "8" : "4"} floodColor="#000" floodOpacity={isHovered ? "0.3" : "0.2"}/>
        </filter>
        <linearGradient id={`barGradient-${x}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.8} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill={`url(#barGradient-${x})`}
        filter={`url(#shadow-${x})`}
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill="url(#highlight)"
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isHovered ? 0.4 : 0.1,
        }}
      />
    </g>
  );
};

// Custom 3D Pie Component
const Custom3DPie = (props: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, name } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * startAngle);
  const cos = Math.cos(-RADIAN * startAngle);
  const sx = cx + (outerRadius + (isHovered ? 10 : 0)) * cos;
  const sy = cy + (outerRadius + (isHovered ? 10 : 0)) * sin;
  const mx = cx + (outerRadius + (isHovered ? 10 : 0)) * cos;
  const my = cy + (outerRadius + (isHovered ? 10 : 0)) * sin;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? `translate(${cos * 10}px, ${sin * 10}px)` : 'none',
        cursor: 'pointer',
      }}
    >
      <defs>
        <filter id={`glow-${name}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`pieGradient-${name}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.8} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <path
        d={`M ${sx} ${sy} A ${outerRadius} ${outerRadius} 0 0 1 ${mx} ${my} L ${cx} ${cy} Z`}
        fill={`url(#pieGradient-${name})`}
        filter={isHovered ? `url(#glow-${name})` : ''}
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </g>
  );
};

// Custom Tooltip Component
const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-xl p-4 rounded-xl shadow-lg border border-slate-200"
      >
        <p className="text-slate-800 font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-slate-600">
            {entry.name}: <span className="font-semibold text-slate-800">{formatNum(entry.value)}</span>
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

// StatCard Component
const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon: Icon, gradient, delay }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-70 transition-opacity duration-500 rounded-2xl blur-xl`} />
      <div className="relative bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-100 to-transparent rounded-full blur-2xl transform translate-x-16 -translate-y-16" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <Icon className="w-5 h-5 text-slate-500" />
          </div>
          
          <div className="flex items-baseline space-x-2">
            <motion.span 
              key={value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-slate-800"
            >
              {formatNum(value)}
            </motion.span>
            <span className="text-sm text-slate-500">{unit}</span>
          </div>
          
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-slate-200"
            >
              <p className="text-xs text-slate-500">
                {title === 'Total Emissions' && `Equivalent to ${formatNum(value / 120)} km driven`}
                {title.includes('Volume') && `Material contribution to total emissions`}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Analytics: React.FC = () => {
  const { web3, contract, isConnected } = useWeb3();
  const { convert, label } = useEmissionUnit();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    concreteVolume: 0,
    cltVolume: 0,
    steelVolume: 0,
    totalEmissions: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  
  // Update target state management
  const [emissionTarget, setEmissionTarget] = useState<number>(DEFAULT_TARGET);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState<boolean>(false);

  // Add handlers for target modal
  const handleOpenTargetModal = () => {
    setIsTargetModalOpen(true);
  };

  const handleCloseTargetModal = () => {
    setIsTargetModalOpen(false);
  };

  const handleSaveTarget = (newTarget: number) => {
    console.log('Saving new target:', newTarget); // Debug log
    setEmissionTarget(newTarget);
    setIsTargetModalOpen(false);
  };

  // Update progress calculations
  const calculateProgress = () => {
    if (emissionTarget <= 0) return 0;
    return (stats.totalEmissions / emissionTarget) * 100;
  };

  const progressPercentage = Math.min(calculateProgress(), 100);
  const isOverTarget = progressPercentage >= 100;

  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const globalStats = await contract.methods.getGlobalStats().call();
        setStats({
          concreteVolume: Number(globalStats.concreteVolume) / 1e6,
          cltVolume: Number(globalStats.cltVolume) / 1e6,
          steelVolume: Number(globalStats.steelVolume) / 1e6,
          totalEmissions: Number(globalStats.totalEmissions)
        });

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [contract, isConnected]);

  if (!isConnected) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-center shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10 blur-3xl" />
        <div className="relative flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="h-16 w-16 text-yellow-400 mb-6 drop-shadow-2xl" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
            Wallet Not Connected
          </h2>
          <p className="text-gray-300 max-w-md mb-8">
            Please connect your wallet to view analytics.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.dispatchEvent(new CustomEvent('open-wallet-modal'))}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300"
          >
            Connect Wallet
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl"
      >
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-300">Error</h3>
        <p className="text-red-200 mt-2">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-red-500/20 text-red-200 rounded-xl hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  // Prepare data for charts
  const emissionsData = [
    { 
      name: 'Concrete', 
      emissions: stats.concreteVolume * CONCRETE_FACTOR,
      volume: stats.concreteVolume,
      fill: 'url(#concreteGradient)'
    },
    { 
      name: 'CLT', 
      emissions: stats.cltVolume * CLT_FACTOR,
      volume: stats.cltVolume,
      fill: 'url(#cltGradient)'
    },
    { 
      name: 'Steel', 
      emissions: stats.steelVolume * STEEL_FACTOR,
      volume: stats.steelVolume,
      fill: 'url(#steelGradient)'
    }
  ];

  const pieData = [
    { 
      name: 'Concrete', 
      value: stats.concreteVolume * CONCRETE_FACTOR,
      fill: '#94a3b8'
    },
    { 
      name: 'CLT', 
      value: stats.cltVolume * CLT_FACTOR,
      fill: '#4ade80'
    },
    { 
      name: 'Steel', 
      value: stats.steelVolume * STEEL_FACTOR,
      fill: '#fbbf24'
    }
  ];

  // Update the radial chart data
  const chartData = [
    {
      name: 'Total',
      value: 100,
      fill: '#f1f5f9'
    },
    {
      name: 'Progress',
      value: progressPercentage,
      fill: isOverTarget ? 'url(#warningGradient)' : 'url(#progressGradient)'
    }
  ];

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-slate-600">
          Visualize and analyze your carbon emissions data with interactive 3D charts
        </p>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-200/40 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Emissions" 
          value={convert(stats.totalEmissions)} 
          unit={label}
          icon={Zap}
          gradient="from-purple-200 to-pink-200"
          delay={0}
        />
        <StatCard 
          title="Concrete Volume" 
          value={stats.concreteVolume} 
          unit="m³"
          icon={Sparkles}
          gradient="from-blue-200 to-cyan-200"
          delay={0.1}
        />
        <StatCard 
          title="CLT Volume" 
          value={stats.cltVolume} 
          unit="m³"
          icon={TreePine}
          gradient="from-green-200 to-emerald-200"
          delay={0.2}
        />
        <StatCard 
          title="Steel Volume" 
          value={stats.steelVolume} 
          unit="m³"
          icon={Car}
          gradient="from-orange-200 to-amber-200"
          delay={0.3}
        />
      </div>

      {/* 3D Bar Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-slate-200 overflow-hidden shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/50 pointer-events-none" />
        
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Emissions by Material
          </span>
          <Sparkles className="w-5 h-5 text-purple-500 ml-2" />
        </h2>
        
        <div className="h-96 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={emissionsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="concreteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="cltGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#86efac" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="steelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#fde68a" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="highlight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis 
                stroke="#64748b"
                tickFormatter={(value) => {
                  const converted = convert(value);
                  return converted >= 1000 ? `${(converted / 1000).toFixed(1)}k` : converted.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="emissions" 
                shape={<Custom3DBar />}
                radius={[10, 10, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Pie Chart and Radial Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-slate-200 overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 via-transparent to-blue-100/50 pointer-events-none" />
          
          <h2 className="text-xl font-bold text-slate-800 mb-6">Emission Distribution</h2>
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3"/>
                  </filter>
                </defs>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  activeShape={<Custom3DPie />}
                  animationBegin={0}
                  animationDuration={1500}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-slate-200 overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 via-transparent to-pink-100/50 pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Emission Progress</h2>
            <button
              onClick={handleOpenTargetModal}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm group"
            >
              <Target className="w-4 h-4 text-slate-600 group-hover:text-green-600 transition-colors" />
              <span className="text-sm text-slate-700 group-hover:text-green-600 transition-colors">Set Target</span>
            </button>
          </div>

          <div className="h-80 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="90%" 
                data={chartData}
                startAngle={0}
                endAngle={360}
              >
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f0abfc" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="warningGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className={`text-3xl font-bold ${isOverTarget ? 'text-red-500' : 'text-slate-800'}`}> 
                {Math.round(progressPercentage)}%
              </p>
              <p className="text-sm text-slate-600">
                of {formatNum(convert(emissionTarget))} {label} target
              </p>
              {isOverTarget && (
                <p className="text-sm text-red-500 mt-2">Target exceeded!</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Environmental Impact */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="relative bg-gradient-to-br from-green-100/50 via-white/90 to-blue-100/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-slate-200 shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 via-transparent to-blue-100/30" />
        
        <div className="relative p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Environmental Impact
            </span>
            <TreePine className="w-6 h-6 text-green-500 ml-2" />
          </h2>
          
          <p className="text-slate-700 mb-6">
            Your tracked emissions of <span className="font-bold text-slate-900">{formatNum(convert(stats.totalEmissions))} {label}</span> are equivalent to:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Car,
                value: formatNum(stats.totalEmissions / 120),
                unit: 'km',
                description: 'driven by an average vehicle',
                color: 'from-blue-200 to-cyan-200'
              },
              {
                icon: Zap,
                value: formatNum(stats.totalEmissions / 0.4),
                unit: 'hours',
                description: 'of household energy use',
                color: 'from-yellow-200 to-orange-200'
              },
              {
                icon: TreePine,
                value: formatNum(stats.totalEmissions / 25),
                unit: 'trees',
                description: 'needed to offset for one year',
                color: 'from-green-200 to-emerald-200'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-50 transition-opacity duration-500 rounded-2xl blur-xl`} />
                <div className="relative bg-white/80 p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <item.icon className="w-8 h-8 text-slate-700 mb-3" />
                  <p className="text-3xl font-bold text-slate-800 mb-1">{item.value}</p>
                  <p className="text-sm text-slate-600">{item.unit}</p>
                  <p className="text-xs text-slate-500 mt-2">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <p className="mt-6 text-sm text-slate-500">
            Note: These equivalencies are approximate and based on EPA Greenhouse Gas Equivalencies Calculator.
          </p>
        </div>
      </motion.div>

      {/* Target Modal */}
      <AnimatePresence>
        {isTargetModalOpen && (
          <TargetModal
            isOpen={isTargetModalOpen}
            onClose={handleCloseTargetModal}
            currentTarget={emissionTarget}
            onSave={handleSaveTarget}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analytics;