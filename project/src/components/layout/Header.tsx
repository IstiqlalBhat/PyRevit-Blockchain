import React from 'react';
import { Menu, ChevronDown, Sparkles } from 'lucide-react';
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
              className="text-secondary-600 hover:text-primary-600 focus:outline-none transition-colors duration-200 md:hidden"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-primary-600 animate-float">
                <Sparkles className="h-8 w-8" />
              </span>
              <h1 className="text-xl font-bold text-secondary-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
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
              <div className="glass-button glass-card-hover flex items-center gap-2 py-2 px-4">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                <span className="hidden sm:inline text-secondary-600 text-sm">Connected:</span>
                <span className="text-secondary-900 font-medium">{truncateAddress(account)}</span>
                <ChevronDown className="h-4 w-4 text-secondary-400" />
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