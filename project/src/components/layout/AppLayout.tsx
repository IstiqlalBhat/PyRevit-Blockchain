import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import WalletConnectModal from '../modals/WalletConnectModal';
import { useWeb3 } from '../../context/Web3Context';
import NatureBackground from '../three/NatureBackground';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected, account } = useWeb3();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleWalletModal = () => {
    setWalletModalOpen(!walletModalOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Three.js Animated Background */}
      <NatureBackground />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar}
          toggleWalletModal={toggleWalletModal}
          isConnected={isConnected}
          account={account}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="glass-card glass-card-hover p-6 fade-in-stagger">
              <Outlet />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>

      {/* Wallet Connect Modal */}
      <WalletConnectModal open={walletModalOpen} onClose={toggleWalletModal} />
    </div>
  );
};

export default AppLayout;