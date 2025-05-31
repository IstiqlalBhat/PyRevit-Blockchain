import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useForm } from 'react-hook-form';
import { AlertTriangle, Check, ShieldCheck, UserPlus, Key } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { truncateAddress } from '../utils/formatters';

interface AuthorizeFormData {
  address: string;
}

interface TransferOwnershipFormData {
  address: string;
}

const Settings: React.FC = () => {
  const { web3, contract, account, isConnected } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]);
  const [currentOwner, setCurrentOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const authorizeForm = useForm<AuthorizeFormData>();
  const transferForm = useForm<TransferOwnershipFormData>();

  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get contract owner
        const owner = await contract.methods.owner().call();
        setCurrentOwner(owner);
        setIsOwner(owner.toLowerCase() === account.toLowerCase());

        // For demo purposes, we'll simulate some authorized users
        // In a real app, you would need to query all events or have another way to get all authorized users
        const simulatedAuthUsers = [
          owner,
          "0x3eA9D9f6B1867A328AB338507dFc650229029391",
          "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
        ];
        
        setAuthorizedUsers(simulatedAuthUsers);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching settings data:', err);
        setError('Failed to load settings data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [contract, isConnected, account]);

  const onAuthorize = async (data: AuthorizeFormData) => {
    if (!isConnected || !contract || !account || !isOwner) {
      setError('You must be the contract owner to authorize users.');
      return;
    }

    try {
      setActionInProgress('authorize');
      setError(null);
      setSuccess(null);

      // Call the smart contract
      await contract.methods.authorizeUploader(data.address)
        .send({ from: account });
      
      setSuccess(`Successfully authorized ${truncateAddress(data.address)}`);
      authorizeForm.reset();
      
      // Update the authorized users list
      setAuthorizedUsers([...authorizedUsers, data.address]);
    } catch (err: any) {
      console.error('Error authorizing user:', err);
      setError(err.message || 'Failed to authorize user');
    } finally {
      setActionInProgress(null);
    }
  };

  const onDeauthorize = async (address: string) => {
    if (!isConnected || !contract || !account || !isOwner) {
      setError('You must be the contract owner to deauthorize users.');
      return;
    }

    try {
      setActionInProgress(`deauthorize-${address}`);
      setError(null);
      setSuccess(null);

      // Call the smart contract
      await contract.methods.deauthorizeUploader(address)
        .send({ from: account });
      
      setSuccess(`Successfully deauthorized ${truncateAddress(address)}`);
      
      // Update the authorized users list
      setAuthorizedUsers(authorizedUsers.filter(user => user !== address));
    } catch (err: any) {
      console.error('Error deauthorizing user:', err);
      setError(err.message || 'Failed to deauthorize user');
    } finally {
      setActionInProgress(null);
    }
  };

  const onTransferOwnership = async (data: TransferOwnershipFormData) => {
    if (!isConnected || !contract || !account || !isOwner) {
      setError('You must be the contract owner to transfer ownership.');
      return;
    }

    try {
      setActionInProgress('transfer');
      setError(null);
      setSuccess(null);

      // Call the smart contract
      await contract.methods.transferOwnership(data.address)
        .send({ from: account });
      
      setSuccess(`Successfully transferred ownership to ${truncateAddress(data.address)}`);
      transferForm.reset();
      
      // Update the owner
      setCurrentOwner(data.address);
      setIsOwner(false);
    } catch (err: any) {
      console.error('Error transferring ownership:', err);
      setError(err.message || 'Failed to transfer ownership');
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 max-w-md mb-6">
            Please connect your wallet to access settings.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your carbon ledger settings and access control.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Information */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Contract Information</h2>
          <p className="mt-1 text-sm text-gray-500">
            Details about the smart contract and your access level.
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Contract Address</dt>
              <dd className="mt-1 text-sm text-gray-900">0x9FF88f378cE4c1c2f59f48c30EB718cADEAC1119</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Contract Owner</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentOwner ? truncateAddress(currentOwner) : 'Loading...'}
                {isOwner && <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">You</span>}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Your Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{account ? truncateAddress(account) : 'Not connected'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Your Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {isOwner ? (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Owner</span>
                ) : authorizedUsers.includes(account || '') ? (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Authorized Uploader</span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Standard User</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Access Control - Only visible to the owner */}
      {isOwner && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center">
              <ShieldCheck className="h-5 w-5 text-green-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Access Control</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Manage who can upload and modify carbon emissions data.
            </p>
          </div>
          
          {/* Authorized Users */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3">Authorized Users</h3>
            {authorizedUsers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {authorizedUsers.map((address) => (
                  <li key={address} className="py-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{truncateAddress(address)}</span>
                      {address.toLowerCase() === currentOwner?.toLowerCase() && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Owner</span>
                      )}
                    </div>
                    {address.toLowerCase() !== currentOwner?.toLowerCase() && (
                      <button
                        onClick={() => onDeauthorize(address)}
                        disabled={actionInProgress === `deauthorize-${address}`}
                        className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {actionInProgress === `deauthorize-${address}` ? (
                          <>
                            <LoadingSpinner size="small" color="primary" />
                            <span className="ml-1">Processing...</span>
                          </>
                        ) : 'Remove'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No authorized users found.</p>
            )}
          </div>
          
          {/* Authorize New User */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3">
              <div className="flex items-center">
                <UserPlus className="h-5 w-5 text-green-500 mr-2" />
                <span>Authorize New User</span>
              </div>
            </h3>
            <form onSubmit={authorizeForm.handleSubmit(onAuthorize)} className="sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="authorizeAddress" className="sr-only">
                  Ethereum Address
                </label>
                <input
                  type="text"
                  id="authorizeAddress"
                  className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="0x..."
                  {...authorizeForm.register('address', { required: true, pattern: /^0x[a-fA-F0-9]{40}$/ })}
                />
                {authorizeForm.formState.errors.address && (
                  <p className="mt-1 text-sm text-red-600">Please enter a valid Ethereum address.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={actionInProgress === 'authorize'}
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {actionInProgress === 'authorize' ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    <span className="ml-1">Authorizing...</span>
                  </>
                ) : 'Authorize'}
              </button>
            </form>
          </div>
          
          {/* Transfer Ownership */}
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">
              <div className="flex items-center">
                <Key className="h-5 w-5 text-amber-500 mr-2" />
                <span>Transfer Contract Ownership</span>
              </div>
            </h3>
            <div className="text-sm text-gray-500 mb-4">
              <p>Warning: This action is irreversible. Once ownership is transferred, you will no longer have owner privileges.</p>
            </div>
            <form onSubmit={transferForm.handleSubmit(onTransferOwnership)} className="sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="transferAddress" className="sr-only">
                  New Owner Address
                </label>
                <input
                  type="text"
                  id="transferAddress"
                  className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="0x..."
                  {...transferForm.register('address', { required: true, pattern: /^0x[a-fA-F0-9]{40}$/ })}
                />
                {transferForm.formState.errors.address && (
                  <p className="mt-1 text-sm text-red-600">Please enter a valid Ethereum address.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={actionInProgress === 'transfer'}
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {actionInProgress === 'transfer' ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    <span className="ml-1">Transferring...</span>
                  </>
                ) : 'Transfer Ownership'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Not Owner Message */}
      {!isOwner && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Access Control Restricted</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Only the contract owner can manage access control settings. If you need access to upload carbon data, please contact the contract owner at {truncateAddress(currentOwner || '')}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;