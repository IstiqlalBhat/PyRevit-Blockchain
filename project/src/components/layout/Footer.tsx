import React from 'react';
import { Leaf } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="mx-4 mb-4 glass-card glass-card-hover py-4 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <Leaf className="h-4 w-4 text-primary-600" />
            &copy; {new Date().getFullYear()} Embodied Carbon Ledger. All rights reserved.
          </div>
          <div className="text-sm text-primary-600 font-medium">
            Powered by Ethereum ⚡
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;