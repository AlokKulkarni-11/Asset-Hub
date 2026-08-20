import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Topbar() {
  const user = useAuthStore((state) => state.user);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10">
      {/* Mobile Branding (Logo + Name) */}
      <div className="flex items-center gap-3 md:hidden">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/AssetHub_Logo.png" alt="AssetHub Logo" className="w-7 h-7 shrink-0 object-contain" />
          <img src="/AssetHub_Name.png" alt="Asset Hub" className="h-5 object-contain" />
        </Link>
      </div>

      {/* Desktop Greeting */}
      <div className="hidden md:flex items-center gap-4">
        <h2 className="text-lg font-medium">
          {greeting}, {user?.name?.split(' ')[0] || 'User'} 👋
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          to="/profile"
          className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-background font-medium shadow-accent-500/20 hover:scale-105 transition-transform"
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Link>
      </div>
    </header>
  );
}
