import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import contractAbi from '../data/contractAbi';

interface Web3ContextType {
  web3: Web3 | null;
  contract: any;
  account: string | null;
  isConnected: boolean;
  connecting: boolean;
  error: string | null;
  networkInfo: string | null;
  connectWallet: () => Promise<void>;
  connectToGanache: () => Promise<void>;
}

const defaultContext: Web3ContextType = {
  web3: null,
  contract: null,
  account: null,
  isConnected: false,
  connecting: false,
  error: null,
  networkInfo: null,
  connectWallet: async () => {},
  connectToGanache: async () => {},
};

const Web3Context = createContext<Web3ContextType>(defaultContext);

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

// Ganache default RPC URL
const GANACHE_URL = import.meta.env.VITE_ETHEREUM_PROVIDER_URL || 'http://127.0.0.1:7545';

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<string | null>(null);

  // Contract address from environment variable
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

  // Validate contract address on mount
  useEffect(() => {
    if (!contractAddress || contractAddress === '') {
      console.warn(
        'Warning: VITE_CONTRACT_ADDRESS is not set. ' +
        'Please configure the contract address in .env file or run the deployment script.'
      );
    } else {
      console.log('Contract address:', contractAddress);
    }
  }, [contractAddress]);

  // Try to auto-connect to Ganache on mount
  useEffect(() => {
    // Auto-connect to Ganache if no MetaMask or if MetaMask is on wrong network
    const autoConnect = async () => {
      // Give MetaMask a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If not connected yet, try Ganache
      if (!isConnected && !connecting) {
        try {
          await connectToGanache();
        } catch (err) {
          console.log('Auto-connect to Ganache failed, waiting for manual connection');
        }
      }
    };
    
    autoConnect();
  }, []);

  /**
   * Connect directly to Ganache (no MetaMask needed)
   * This is useful for development/testing
   */
  const connectToGanache = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      console.log('Connecting to Ganache at:', GANACHE_URL);
      
      const web3Instance = new Web3(GANACHE_URL);
      
      // Test connection
      const isListening = await web3Instance.eth.net.isListening();
      if (!isListening) {
        throw new Error('Cannot connect to Ganache. Is it running?');
      }
      
      // Get network info
      const networkId = await web3Instance.eth.net.getId();
      const blockNumber = await web3Instance.eth.getBlockNumber();
      setNetworkInfo(`Ganache (Network: ${networkId}, Block: ${blockNumber})`);
      console.log(`Connected to Ganache - Network ID: ${networkId}, Block: ${blockNumber}`);
      
      // Get accounts from Ganache
      const accounts = await web3Instance.eth.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts available in Ganache');
      }
      
      setWeb3(web3Instance);
      setAccount(accounts[0]);
      console.log('Using Ganache account:', accounts[0]);
      
      // Verify contract exists at address
      if (!contractAddress) {
        throw new Error('Contract address not configured. Run deployment first.');
      }
      
      const code = await web3Instance.eth.getCode(contractAddress);
      if (code === '0x' || code === '0x0') {
        throw new Error(`No contract found at ${contractAddress}. Did you deploy it?`);
      }
      console.log('Contract verified at:', contractAddress);
      
      // Initialize contract
      const contractInstance = new web3Instance.eth.Contract(
        contractAbi as AbiItem[],
        contractAddress
      );
      
      // Test contract call
      try {
        const stats = await contractInstance.methods.getGlobalStats().call();
        console.log('Contract test call successful:', stats);
      } catch (testErr: any) {
        console.error('Contract test call failed:', testErr);
        throw new Error(`Contract ABI mismatch or contract error: ${testErr.message}`);
      }
      
      setContract(contractInstance);
      setIsConnected(true);
      console.log('Successfully connected to Ganache!');
      
    } catch (err: any) {
      console.error('Ganache connection error:', err);
      setError(err.message || 'Failed to connect to Ganache');
      setIsConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Connect via MetaMask
   * Make sure MetaMask is configured to connect to Ganache network
   */
  const connectWallet = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum as any);
        
        // Get network info
        const networkId = await web3Instance.eth.net.getId();
        const blockNumber = await web3Instance.eth.getBlockNumber();
        setNetworkInfo(`MetaMask (Network: ${networkId}, Block: ${blockNumber})`);
        console.log(`MetaMask Network ID: ${networkId}`);
        
        // Check if on Ganache network (usually 5777 or 1337)
        if (networkId !== BigInt(5777) && networkId !== BigInt(1337)) {
          console.warn(`MetaMask is on network ${networkId}, but Ganache is usually 5777 or 1337`);
          console.warn('Make sure MetaMask is connected to Ganache (localhost:7545)');
        }
        
        setWeb3(web3Instance);
        
        // Request account access
        const accounts = await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        console.log('MetaMask account:', accounts[0]);
        
        // Verify contract exists
        if (!contractAddress) {
          throw new Error('Contract address not configured');
        }
        
        const code = await web3Instance.eth.getCode(contractAddress);
        if (code === '0x' || code === '0x0') {
          throw new Error(
            `No contract at ${contractAddress} on this network. ` +
            `Make sure MetaMask is connected to Ganache (localhost:7545)`
          );
        }
        
        // Initialize contract
        const contractInstance = new web3Instance.eth.Contract(
          contractAbi as AbiItem[],
          contractAddress
        );
        
        setContract(contractInstance);
        setIsConnected(true);
      } else {
        // No MetaMask - fall back to Ganache
        console.log('MetaMask not found, connecting directly to Ganache');
        await connectToGanache();
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect to wallet');
      
      // Try Ganache as fallback
      console.log('Attempting fallback to direct Ganache connection...');
      try {
        await connectToGanache();
      } catch (ganacheErr) {
        // Keep original error
      }
    } finally {
      setConnecting(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      (window.ethereum as any).on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      });

      (window.ethereum as any).on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        (window.ethereum as any).removeAllListeners();
      }
    };
  }, []);

  const value = {
    web3,
    contract,
    account,
    isConnected,
    connecting,
    error,
    networkInfo,
    connectWallet,
    connectToGanache,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
