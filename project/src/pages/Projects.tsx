import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FolderPlus, SearchIcon, AlertTriangle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useEmissionUnit } from '../context/EmissionUnitContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatNumber } from '../utils/formatters';

interface ProjectSummary {
  projectId: string;
  totalConcrete: number;
  totalCLT: number;
  totalSteel: number;
  totalEmissions: number;
  recordCount: number;
  lastUpdated: number;
}

const Projects: React.FC = () => {
  const { web3, contract, account, isConnected } = useWeb3();
  const { convert, label } = useEmissionUnit();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!isConnected || !contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get user's projects
        const projectIds = await contract.methods.getUserProjects(account).call();
        
        // Fetch each project's details
        const projectDetails = await Promise.all(
          projectIds.map(async (projectId: string) => {
            const summary = await contract.methods.projectSummaries(projectId).call();
            return {
              projectId,
              totalConcrete: Number(summary.totalConcrete) / 1e6, // Convert to m³
              totalCLT: Number(summary.totalCLT) / 1e6,
              totalSteel: Number(summary.totalSteel) / 1e6,
              totalEmissions: Number(summary.totalEmissions),
              recordCount: Number(summary.recordCount),
              lastUpdated: Number(summary.lastUpdated) * 1000 // Convert to milliseconds
            };
          })
        );
        
        setProjects(projectDetails);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again.');
        setLoading(false);
      }
    };

    fetchProjects();
  }, [contract, isConnected, account]);

  const filteredProjects = projects.filter(project => 
    project.projectId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 max-w-md mb-6">
            Please connect your wallet to access your projects.
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
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length > 0 ? (
        <div className="bg-white shadow-sm overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredProjects.map((project, index) => (
              <li 
                key={project.projectId} 
                className="transition-all duration-300 ease-in-out hover:shadow-md fade-in-stagger"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link to={`/projects/${project.projectId}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-green-600 truncate">{project.projectId}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {project.recordCount} records
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Total Emissions: {formatNumber(convert(project.totalEmissions))} {label}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        <p>
                          Last updated <time dateTime={new Date(project.lastUpdated).toISOString()}>{formatDate(project.lastUpdated)}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg p-6 text-center transition-all duration-300 ease-in-out hover:shadow-xl">
          <div className="flex flex-col items-center justify-center py-6">
            <FolderPlus className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No projects match your search criteria.' : 'Start by creating a new project.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;