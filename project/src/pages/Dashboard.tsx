import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FolderKanban, FileBarChart, AlertTriangle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { formatNumber } from '../utils/formatters';
import EmissionsChart from '../components/charts/EmissionsChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useEmissionUnit } from '../context/EmissionUnitContext';

const Dashboard: React.FC = () => {
  const { web3, contract, account, isConnected } = useWeb3();
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
          concreteVolume: Number(globalStats.concreteVolume) / 1e6, // Convert BigInt to Number before division
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

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 max-w-md mb-6">
            Please connect your wallet to access the Carbon Ledger dashboard and track your emission data.
          </p>
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('open-wallet-modal'))}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.03]">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Emissions</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(convert(stats.totalEmissions))} {label}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.03]">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Your Projects</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {projectCount}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.03]">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FileBarChart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Concrete Volume</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats.concreteVolume)} m³
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.03]">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
                <FileBarChart className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Materials</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(stats.concreteVolume + stats.cltVolume + stats.steelVolume)} m³
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ease-in-out hover:shadow-xl">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Emissions by Material</h2>
        <div className="h-80">
          <EmissionsChart 
            concreteVolume={stats.concreteVolume}
            cltVolume={stats.cltVolume}
            steelVolume={stats.steelVolume}
          />
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Recent Projects</h2>
        </div>
        {userProjects.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {userProjects.slice(0, 5).map((project, index) => (
              <li 
                key={index} 
                className="transition-all duration-200 ease-in-out hover:bg-green-50 fade-in-stagger"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link 
                  to={`/projects/${project}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-green-600 truncate">{project}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          View Details
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5 sm:px-6 text-center">
            <p className="text-gray-500">No projects found. Start by recording emissions for a project.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;