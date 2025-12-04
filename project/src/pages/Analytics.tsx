import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import { AlertTriangle, Zap, TreePine, Car, Sparkles, Target, X, Leaf, Wind, Droplets } from 'lucide-react';
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
  iconColor: string;
}

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTarget: number;
  onSave: (newTarget: number) => void;
}

const DEFAULT_TARGET = 5000; // Default 5000 tCO₂e

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
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 font-display">Set Emission Target</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
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
              className="glass-input w-full"
              placeholder="Enter target value"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary px-6 py-2"
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

// Custom Tooltip Component
const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-4 shadow-lg border border-primary-100/50 !bg-white/95 backdrop-blur-xl">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-slate-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></span>
              {entry.name}:
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {formatNum(entry.value)}
              {entry.name === 'Volume' ? ' m³' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// StatCard Component
const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon: Icon, gradient, delay, iconColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`glass-card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${gradient}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24 transform rotate-12 translate-x-4 -translate-y-4" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className={`p-2.5 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
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
          <span className="text-sm text-slate-500 font-medium">{unit}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-slate-100/50"
        >
          <p className="text-xs text-slate-400">
            {title === 'Total Emissions' && `Equivalent to ${formatNum(value / 120)} km driven`}
            {title.includes('Volume') && `Material contribution`}
          </p>
        </motion.div>
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
        className="glass-card p-12 text-center max-w-2xl mx-auto mt-10"
      >
        <div className="relative flex flex-col items-center justify-center">
          <div className="bg-yellow-50 p-6 rounded-full mb-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 font-display">
            Wallet Not Connected
          </h2>
          <p className="text-slate-500 max-w-md mb-8 text-lg">
            Please connect your wallet to view detailed analytics and charts.
          </p>
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('open-wallet-modal'))}
            className="btn-primary px-8 py-3 shadow-lg hover:shadow-primary-500/30"
          >
            Connect Wallet
          </button>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 text-center max-w-lg mx-auto mt-20 border-red-100 bg-red-50/50"
      >
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
        >
          Retry
        </button>
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
      fill: '#64748b' // Slate-500
    },
    {
      name: 'CLT',
      value: stats.cltVolume * CLT_FACTOR,
      fill: '#f59e0b' // Amber-500
    },
    {
      name: 'Steel',
      value: stats.steelVolume * STEEL_FACTOR,
      fill: '#3b82f6' // Blue-500
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
      fill: isOverTarget ? '#ef4444' : '#10b981'
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <TargetModal
        isOpen={isTargetModalOpen}
        onClose={handleCloseTargetModal}
        currentTarget={emissionTarget}
        onSave={handleSaveTarget}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <h1 className="text-4xl font-bold text-gradient font-display mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-slate-500 text-lg">
          Visualize and analyze your carbon emissions data
        </p>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Emissions"
          value={convert(stats.totalEmissions)}
          unit={label}
          icon={Zap}
          gradient="stat-card-emerald"
          iconColor="text-emerald-600"
          delay={0}
        />
        <StatCard
          title="Concrete Volume"
          value={stats.concreteVolume}
          unit="m³"
          icon={Sparkles}
          gradient="stat-card-slate"
          iconColor="text-slate-600"
          delay={0.1}
        />
        <StatCard
          title="CLT Volume"
          value={stats.cltVolume}
          unit="m³"
          icon={TreePine}
          gradient="stat-card-amber"
          iconColor="text-amber-600"
          delay={0.2}
        />
        <StatCard
          title="Steel Volume"
          value={stats.steelVolume}
          unit="m³"
          icon={Car}
          gradient="stat-card-blue"
          iconColor="text-blue-600"
          delay={0.3}
        />
      </div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            Emissions by Material
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </h2>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={emissionsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barSize={60}
            >
              <defs>
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                tickFormatter={(value) => {
                  const converted = convert(value);
                  return converted >= 1000 ? `${(converted / 1000).toFixed(1)}k` : converted.toString();
                }}
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="emissions"
                radius={[12, 12, 0, 0]}
                animationDuration={1500}
              >
                {emissionsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    style={{ filter: `drop-shadow(0 4px 6px ${index === 0 ? '#64748b' : index === 1 ? '#f59e0b' : '#3b82f6'}40)` }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Pie Chart and Radial Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8"
        >
          <h2 className="text-xl font-bold text-slate-800 font-display mb-6">Emission Distribution</h2>
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-8 relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-xl font-bold text-slate-800 font-display">Emission Progress</h2>
            <button
              onClick={handleOpenTargetModal}
              className="flex items-center space-x-2 px-4 py-2 bg-white/50 rounded-xl border border-slate-200 hover:bg-white hover:border-emerald-200 transition-all shadow-sm group"
            >
              <Target className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              <span className="text-sm font-medium text-slate-600 group-hover:text-emerald-700 transition-colors">Set Target</span>
            </button>
          </div>

          <div className="h-80 relative flex items-center justify-center z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                barSize={24}
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#f1f5f9' }}
                  dataKey="value"
                  cornerRadius={12}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className={`text-4xl font-bold font-display ${isOverTarget ? 'text-red-500' : 'text-emerald-600'}`}>
                {Math.round(progressPercentage)}%
              </p>
              <p className="text-sm text-slate-500 font-medium mt-1">
                of {formatNum(convert(emissionTarget))} {label}
              </p>
              {isOverTarget && (
                <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  Exceeded
                </span>
              )}
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
        </motion.div>
      </div>

      {/* Environmental Impact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card-green p-8 relative overflow-hidden"
      >
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 font-display mb-6 flex items-center">
            <span className="text-gradient-vibrant">
              Environmental Impact
            </span>
            <Leaf className="w-6 h-6 text-emerald-500 ml-2" />
          </h2>

          <p className="text-slate-600 mb-8 text-lg">
            Your tracked emissions of <span className="font-bold text-slate-900">{formatNum(convert(stats.totalEmissions))} {label}</span> are equivalent to:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Car,
                value: formatNum(stats.totalEmissions / 120),
                unit: 'km',
                description: 'driven by an average vehicle',
                color: 'text-blue-500',
                bg: 'bg-blue-50'
              },
              {
                icon: Zap,
                value: formatNum(stats.totalEmissions / 0.4),
                unit: 'hours',
                description: 'of household energy use',
                color: 'text-amber-500',
                bg: 'bg-amber-50'
              },
              {
                icon: TreePine,
                value: formatNum(stats.totalEmissions / 25),
                unit: 'trees',
                description: 'needed to offset for one year',
                color: 'text-emerald-500',
                bg: 'bg-emerald-50'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1 font-display">{item.value}</p>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{item.unit}</p>
                <p className="text-sm text-slate-500 mt-2">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;