// Global type overrides
interface EthereumProvider {
  request?: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeAllListeners?: () => void;
}

declare interface Window {
  ethereum?: EthereumProvider;
} 