import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Users, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

export default function Sidebar({ className = '', onLinkClick }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Assets', path: '/assets', icon: Wallet },
    { name: 'Family', path: '/family', icon: Users },
    { name: 'Upcoming', path: '/maturities', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: Settings },
  ];

  return (
    <aside className={className}>
      <div className="p-6 flex items-center shrink-0">
        <h1 className="text-2xl font-bold font-dmsans text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-400 flex items-center gap-4 whitespace-nowrap">
          <Wallet className="w-8 h-8 text-accent-500 shrink-0" />
          <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            Asset Hub
          </span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-accent-500/10 text-accent-500 font-medium border border-accent-500/20'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            <item.icon className="w-6 h-6 shrink-0" />
            <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto shrink-0">
        <button
          onClick={() => {
            if (onLinkClick) onLinkClick();
            logout();
          }}
          className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-colors duration-200 whitespace-nowrap"
        >
          <LogOut className="w-6 h-6 shrink-0" />
          <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
