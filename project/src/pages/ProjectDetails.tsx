import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileBarChart, FileText, Share2, Download, BarChart, AlertTriangle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatNumber as formatNum, formatDate } from '../utils/formatters';
import { useEmissionUnit } from '../context/EmissionUnitContext';

interface ProjectSummary {
  totalConcrete: number;
  totalCLT: number;
  totalSteel: number;
  totalEmissions: number;
  recordCount: number;
  lastUpdated: number;
}

interface MaterialRecord {
  id: number;
  material: string;
  volume: number;
  a1A3: number;
  a4: number;
  a5w: number;
  total: number;
  timestamp: number;
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { web3, contract, isConnected } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [records, setRecords] = useState<MaterialRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { convert, label } = useEmissionUnit();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!isConnected || !contract || !id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get project summary
        const projectSummary = await contract.methods.projectSummaries(id).call();
        setSummary({
          totalConcrete: Number(projectSummary.totalConcrete) / 1e6, // Convert to m³
          totalCLT: Number(projectSummary.totalCLT) / 1e6,
          totalSteel: Number(projectSummary.totalSteel) / 1e6,
          totalEmissions: Number(projectSummary.totalEmissions),
          recordCount: Number(projectSummary.recordCount),
          lastUpdated: Number(projectSummary.lastUpdated) * 1000 // Convert to milliseconds
        });

        // For a real implementation, we would need to query all material records
        // and filter by projectId, but for this demo we'll simulate some records
        // based on the summary data
        const materialMap = ['Concrete', 'CLT', 'Steel'];
        const simulatedRecords: MaterialRecord[] = [];
        
        if (Number(projectSummary.totalConcrete) > 0) {
          simulatedRecords.push({
            id: 1,
            material: 'Concrete',
            volume: Number(projectSummary.totalConcrete) / 1e6,
            a1A3: Number(projectSummary.totalEmissions) * 0.3,
            a4: Number(projectSummary.totalEmissions) * 0.05,
            a5w: Number(projectSummary.totalEmissions) * 0.02,
            total: Number(projectSummary.totalEmissions) * 0.37,
            timestamp: Number(projectSummary.lastUpdated) * 1000
          });
        }
        
        if (Number(projectSummary.totalCLT) > 0) {
          simulatedRecords.push({
            id: 2,
            material: 'CLT',
            volume: Number(projectSummary.totalCLT) / 1e6,
            a1A3: Number(projectSummary.totalEmissions) * 0.25,
            a4: Number(projectSummary.totalEmissions) * 0.08,
            a5w: Number(projectSummary.totalEmissions) * 0.01,
            total: Number(projectSummary.totalEmissions) * 0.34,
            timestamp: Number(projectSummary.lastUpdated) * 1000
          });
        }
        
        if (Number(projectSummary.totalSteel) > 0) {
          simulatedRecords.push({
            id: 3,
            material: 'Steel',
            volume: Number(projectSummary.totalSteel) / 1e6,
            a1A3: Number(projectSummary.totalEmissions) * 0.2,
            a4: Number(projectSummary.totalEmissions) * 0.06,
            a5w: Number(projectSummary.totalEmissions) * 0.03,
            total: Number(projectSummary.totalEmissions) * 0.29,
            timestamp: Number(projectSummary.lastUpdated) * 1000
          });
        }
        
        setRecords(simulatedRecords);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details. Please try again.');
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [contract, isConnected, id]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 max-w-md mb-6">
            Please connect your wallet to view project details.
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

  if (!summary) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-yellow-800">Project Not Found</h3>
        <p className="text-yellow-700">The project with ID "{id}" could not be found.</p>
        <Link
          to="/projects"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
      </div>
    );
  }

  // Material colors for the UI
  const materialColors: { [key: string]: string } = {
    'Concrete': 'bg-gray-100 text-gray-800 border-gray-300',
    'CLT': 'bg-green-100 text-green-800 border-green-300',
    'Steel': 'bg-amber-100 text-amber-800 border-amber-300'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center">
            <Link
              to="/projects"
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 truncate">{id}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Last updated {formatDate(summary.lastUpdated)} • {summary.recordCount} records
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </button>
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.03]">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <BarChart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Emissions</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNum(convert(summary.totalEmissions))} {label}
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
              <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                <FileBarChart className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Concrete Volume</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNum(summary.totalConcrete)} m³
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
              <div className="flex-shrink-0 bg-lime-100 rounded-md p-3">
                <FileBarChart className="h-6 w-6 text-lime-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">CLT Volume</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNum(summary.totalCLT)} m³
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Steel Volume</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNum(summary.totalSteel)} m³
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Records */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Material Records</h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed breakdown of materials and their embodied carbon emissions.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume (m³)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  A1-A3 ({label})
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  A4 ({label})
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  A5 ({label})
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total ({label})
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${materialColors[record.material]}`}>
                        {record.material}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNum(record.volume)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNum(convert(record.a1A3))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNum(convert(record.a4))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNum(convert(record.a5w))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatNum(convert(record.total))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(record.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes on Embodied Carbon */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">About Embodied Carbon Stages</h2>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">A1-A3: Product Stage</dt>
              <dd className="mt-1 text-sm text-gray-900">
                Emissions from raw material extraction, transport to factory, and manufacturing.
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">A4: Transport to Site</dt>
              <dd className="mt-1 text-sm text-gray-900">
                Emissions from transportation of materials from factory to construction site.
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">A5: Construction</dt>
              <dd className="mt-1 text-sm text-gray-900">
                Emissions from construction activities, including material waste.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;