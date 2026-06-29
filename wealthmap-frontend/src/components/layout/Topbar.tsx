import React, { useMemo } from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const user = useAuthStore((state) => state.user);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <header className="h-16 border-b border-white/10 bg-navy-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-text-secondary hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-medium hidden sm:block">
          {greeting}, {user?.name?.split(' ')[0] || 'User'} 👋
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          to="/profile"
          className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-navy-950 font-medium shadow-lg shadow-gold-500/20 hover:scale-105 transition-transform"
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Link>
      </div>
    </header>
  );
}
