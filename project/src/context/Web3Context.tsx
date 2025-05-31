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
  connectWallet: () => Promise<void>;
}

const defaultContext: Web3ContextType = {
  web3: null,
  contract: null,
  account: null,
  isConnected: false,
  connecting: false,
  error: null,
  connectWallet: async () => {},
};

const Web3Context = createContext<Web3ContextType>(defaultContext);

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Contract address
  const contractAddress = '0x799222FfE5Bc157972C7FbA9521F1568e525710e';

  const connectWallet = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum as any);
        setWeb3(web3Instance);
        
        // Request account access
        const accounts = await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        
        // Initialize contract
        const contractInstance = new web3Instance.eth.Contract(
          contractAbi as AbiItem[],
          contractAddress
        );
        setContract(contractInstance);
        setIsConnected(true);
      } else {
        setError('Please install MetaMask to use this application');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to wallet');
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

  // Attempt eager connection on mount
  useEffect(() => {
    (async () => {
      if (window.ethereum && !isConnected && !connecting) {
        try {
          const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error('Eager connect failed', err);
        }
      }
    })();
  }, []);

  const value = {
    web3,
    contract,
    account,
    isConnected,
    connecting,
    error,
    connectWallet,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};