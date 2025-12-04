import React, { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  Settings,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } transition-opacity ease-linear duration-300`}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-secondary-900/50 backdrop-blur-sm ${
            open ? 'opacity-100' : 'opacity-0'
          } transition-opacity ease-linear duration-300`}
          onClick={() => setOpen(false)}
        />

        {/* Sidebar panel */}
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full glass-card transform ${
            open ? 'translate-x-0' : '-translate-x-full'
          } transition ease-in-out duration-300 ml-4 my-4 mr-2`}
        >
          {/* Close button */}
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="flex items-center justify-center h-8 w-8 glass-button focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-5 w-5 text-secondary-700" aria-hidden="true" />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-6">
              <span className="text-primary-600 animate-float">
                <Sparkles className="h-8 w-8" />
              </span>
              <span className="ml-3 text-xl font-bold text-secondary-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Carbon Ledger
              </span>
            </div>
            <nav className="mt-8 flex-1 px-4 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'glass-card bg-primary-50/50 text-primary-800 shadow-glass-md'
                        : 'text-secondary-700 hover:glass-card hover:text-secondary-900'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  <item.icon
                    className="mr-4 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col h-full glass-card ml-4 my-4 mr-2">
            <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-6">
                <span className="text-primary-600 animate-float">
                  <Sparkles className="h-8 w-8" />
                </span>
                <span className="ml-3 text-xl font-bold text-secondary-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Carbon Ledger
                </span>
              </div>
              <nav className="mt-8 flex-1 px-4 space-y-2">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover-lift ${
                        isActive
                          ? 'glass-card bg-primary-50/50 text-primary-800 shadow-glass-md'
                          : 'text-secondary-700 hover:glass-card hover:text-secondary-900'
                      }`
                    }
                  >
                    <item.icon
                      className="mr-3 h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;