import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Download } from 'lucide-react';

export default function Topbar() {
  const user = useAuthStore((state) => state.user);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // Catch PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10">
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

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-3">
        {/* PWA App Install Button (if eligible) */}
        {deferredInstallPrompt && (
          <button
            onClick={handleInstallClick}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/30 text-accent-500 text-xs font-medium transition-all"
            title="Install Asset Hub App"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        {/* User Profile Avatar */}
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