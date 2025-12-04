import React from 'react';
import { Menu, ChevronDown, Leaf } from 'lucide-react';
import { truncateAddress } from '../../utils/formatters';
import { useEmissionUnit } from '../../context/EmissionUnitContext';

interface HeaderProps {
  toggleSidebar: () => void;
  toggleWalletModal: () => void;
  isConnected: boolean;
  account: string | null;
}

const Header: React.FC<HeaderProps> = ({ 
  toggleSidebar, 
  toggleWalletModal,
  isConnected,
  account
}) => {
  const { unit, setUnit } = useEmissionUnit();

  return (
    <header className="sticky top-4 z-30 mx-4 mb-4 glass-card glass-card-hover animate-slide-up">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-slate-600 hover:text-primary-600 focus:outline-none transition-colors duration-200 md:hidden"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl blur-lg opacity-40 animate-pulse-slow"></div>
                <div className="relative p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-green">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-xl font-bold font-display text-gradient-vibrant">
                Carbon Ledger
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Unit selector */}
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as import('../../context/EmissionUnitContext').EmissionUnit)}
              className="glass-select text-sm py-2 px-3"
              title="Select emission unit"
            >
              <option value="kg">kg CO₂e</option>
              <option value="t">t CO₂e</option>
              <option value="kt">kt CO₂e</option>
            </select>

            {isConnected && account ? (
              <div className="glass-card-green px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:shadow-green transition-all duration-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                </span>
                <span className="hidden sm:inline text-slate-600 text-sm">Connected:</span>
                <span className="text-slate-800 font-semibold">{truncateAddress(account)}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            ) : (
              <button
                onClick={toggleWalletModal}
                className="theme-button hover-lift"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
