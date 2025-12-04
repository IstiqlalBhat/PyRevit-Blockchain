import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FolderKanban, FileBarChart, AlertTriangle, ArrowUpRight, Activity, Layers, Leaf, TreeDeciduous } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { formatNumber } from '../utils/formatters';
import EmissionsChart from '../components/charts/EmissionsChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useEmissionUnit } from '../context/EmissionUnitContext';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { contract, account, isConnected, networkInfo, connectToGanache } = useWeb3();
  const { convert, label } = useEmissionUnit();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    concreteVolume: 0,
    cltVolume: 0,
    steelVolume: 0,
    totalEmissions: 0
  });
  const [projectCount, setProjectCount] = useState(0);
  const [userProjects, setUserProjects] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get global stats
        const globalStats = await contract.methods.getGlobalStats().call();
        setStats({
          concreteVolume: Number(globalStats.concreteVolume) / 1e6,
          cltVolume: Number(globalStats.cltVolume) / 1e6,
          steelVolume: Number(globalStats.steelVolume) / 1e6,
          totalEmissions: Number(globalStats.totalEmissions)
        });

        // Get user's projects
        if (account) {
          const projects = await contract.methods.getUserProjects(account).call();
          setUserProjects(projects);
          setProjectCount(projects.length);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [contract, isConnected, account]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 text-center max-w-lg w-full mx-4 relative overflow-hidden"
        >
          {/* Decorative gradient orb */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-300/30 to-secondary-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-accent-300/20 to-primary-300/20 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col items-center justify-center">
            <div className="p-5 rounded-2xl mb-6 bg-gradient-to-br from-primary-100 to-secondary-100 shadow-green">
              <Leaf className="h-12 w-12 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-3 font-display">Connect Wallet</h2>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
              Connect to view the Carbon Ledger dashboard and track your emission data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={() => connectToGanache()}
                className="flex-1 btn-primary py-3.5"
              >
                Connect to Ganache
              </button>
              <button
                onClick={() => document.dispatchEvent(new CustomEvent('open-wallet-modal'))}
                className="flex-1 btn-secondary py-3.5"
              >
                Connect MetaMask
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-6">
              For development, use "Connect to Ganache" (no MetaMask needed)
            </p>
          </div>
        </motion.div>
      </div>
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
      <div className="glass-card p-8 text-center max-w-lg mx-auto mt-20 border-red-200 bg-red-50/50">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient font-display tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-2 text-lg">Overview of your carbon footprint and projects</p>
        </div>
        {networkInfo && (
          <div className="glass-card-green px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-primary-700">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse shadow-glow-green-sm"></div>
            {networkInfo}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Emissions */}
        <motion.div variants={itemVariants} className="glass-card stat-card-emerald p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TreeDeciduous className="w-24 h-24 text-primary-600 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-green">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium relative z-10">Total Emissions</h3>
          <div className="mt-2 flex items-baseline relative z-10">
            <span className="text-3xl font-bold text-slate-800">
              {formatNumber(convert(stats.totalEmissions))}
            </span>
            <span className="ml-2 text-sm text-slate-500 font-medium">{label}</span>
          </div>
        </motion.div>

        {/* Total Projects */}
        <motion.div variants={itemVariants} className="glass-card stat-card-teal p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FolderKanban className="w-24 h-24 text-accent-600 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30">
              <FolderKanban className="h-6 w-6" />
            </div>
            <span className="badge-active">
              Active
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium relative z-10">Total Projects</h3>
          <div className="mt-2 flex items-baseline relative z-10">
            <span className="text-3xl font-bold text-slate-800">{projectCount}</span>
            <span className="ml-2 text-sm text-slate-500 font-medium">Projects</span>
          </div>
        </motion.div>

        {/* Concrete Volume */}
        <motion.div variants={itemVariants} className="glass-card stat-card-green p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-24 h-24 text-secondary-600 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-lg shadow-secondary-500/30">
              <FileBarChart className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium relative z-10">Concrete Volume</h3>
          <div className="mt-2 flex items-baseline relative z-10">
            <span className="text-3xl font-bold text-slate-800">{formatNumber(stats.concreteVolume)}</span>
            <span className="ml-2 text-sm text-slate-500 font-medium">m³</span>
          </div>
        </motion.div>

        {/* Total Materials */}
        <motion.div variants={itemVariants} className="glass-card stat-card-leaf p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Leaf className="w-24 h-24 text-leaf-600 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-leaf-500 to-leaf-600 text-white shadow-lg shadow-leaf-500/30">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium relative z-10">Total Materials</h3>
          <div className="mt-2 flex items-baseline relative z-10">
            <span className="text-3xl font-bold text-slate-800">
              {formatNumber(stats.concreteVolume + stats.cltVolume + stats.steelVolume)}
            </span>
            <span className="ml-2 text-sm text-slate-500 font-medium">m³</span>
          </div>
        </motion.div>
      </div>

      {/* Chart and Projects Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 font-display">Emissions Overview</h2>
            <select className="glass-select text-sm py-2 pl-3 pr-10">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[400px] w-full">
            <EmissionsChart
              concreteVolume={stats.concreteVolume}
              cltVolume={stats.cltVolume}
              steelVolume={stats.steelVolume}
            />
          </div>
        </motion.div>

        {/* Recent Projects */}
        <motion.div variants={itemVariants} className="glass-card p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-primary-100/50 bg-gradient-to-r from-primary-50/50 to-transparent backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-800 font-display">Recent Projects</h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] p-2">
            {userProjects.length > 0 ? (
              <ul className="space-y-2">
                {userProjects.slice(0, 5).map((project, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/projects/${project}`}
                      className="block p-4 rounded-xl hover:bg-primary-50/50 transition-all duration-200 group border border-transparent hover:border-primary-100 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-green">
                            {project.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">{project}</p>
                            <p className="text-xs text-slate-500">Updated 2h ago</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 mb-4">
                  <FolderKanban className="w-10 h-10 text-primary-400" />
                </div>
                <p className="font-medium">No projects found.</p>
                <Link to="/projects/new" className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-semibold hover:underline">
                  Create your first project
                </Link>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-primary-100/50 bg-gradient-to-r from-slate-50/80 to-transparent text-center">
            <Link to="/projects" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors hover:underline">
              View All Projects →
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
