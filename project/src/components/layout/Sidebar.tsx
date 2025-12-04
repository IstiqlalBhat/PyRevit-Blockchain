import React, { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  Settings,
  Leaf
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

  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl blur-lg opacity-40 animate-pulse-slow"></div>
        <div className="relative p-2.5 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-green">
          <Leaf className="h-6 w-6 text-white" />
        </div>
      </div>
      <span className="text-xl font-bold font-display text-gradient-vibrant">
        Carbon Ledger
      </span>
    </div>
  );

  const NavItem = ({ item, onClick }: { item: typeof navigation[0], onClick?: () => void }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-green'
            : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700'
        }`
      }
      onClick={onClick}
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'
            }`}
            aria-hidden="true"
          />
          {item.name}
        </>
      )}
    </NavLink>
  );

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
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm ${
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
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-primary-100 text-slate-500 hover:text-primary-600 transition-colors duration-200"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 px-6">
              <Logo />
            </div>
            <nav className="mt-8 flex-1 px-4 space-y-2">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} onClick={() => setOpen(false)} />
              ))}
            </nav>
            
            {/* Footer decoration */}
            <div className="px-6 pt-6">
              <div className="divider-gradient mb-4"></div>
              <p className="text-xs text-slate-400 text-center">
                🌱 Building a sustainable future
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col h-full glass-card ml-4 my-4 mr-2 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-primary-300/20 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-tl from-secondary-300/20 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto relative z-10">
              <div className="flex items-center flex-shrink-0 px-6">
                <Logo />
              </div>
              <nav className="mt-8 flex-1 px-4 space-y-2">
                {navigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </nav>
              
              {/* Footer decoration */}
              <div className="px-6 pt-6">
                <div className="divider-gradient mb-4"></div>
                <div className="glass-card-green p-4 text-center">
                  <p className="text-xs text-primary-700 font-medium">
                    🌱 Building a sustainable future
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
