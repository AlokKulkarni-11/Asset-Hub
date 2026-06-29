import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Users, Calendar, Settings } from 'lucide-react';

export default function MobileNav() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Assets', path: '/assets', icon: Wallet },
    { name: 'Family', path: '/family', icon: Users },
    { name: 'Upcoming', path: '/maturities', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy-900/95 backdrop-blur-xl border-t border-white/10 z-50 px-2 pb-safe pt-2">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-gold-400'
                  : 'text-text-muted hover:text-text-primary'
              }`
            }
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
