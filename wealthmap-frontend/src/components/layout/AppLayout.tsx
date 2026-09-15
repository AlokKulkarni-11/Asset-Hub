import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import FloatingActionHub from '../ui/FloatingActionHub';
import { FloatingAiAssistant } from '../ai/FloatingAiAssistant';
import { WifiOff } from 'lucide-react';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <div className="bg-orb-gold" />
      <div className="bg-orb-blue" />
      
      {/* Sidebar spacer for layout */}
      <div className="hidden md:block w-20 shrink-0 border-r border-transparent" />

      {/* Sidebar actual (Hover to expand on desktop) */}
      <Sidebar 
        className="hidden md:flex flex-col absolute left-0 top-0 bottom-0 w-20 hover:w-64 transition-all duration-300 border-r border-border bg-white z-50 overflow-hidden group shadow-2xl shadow-slate-200"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        <Topbar />
        
        {isOffline && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-500 animate-in fade-in">
            <WifiOff className="w-4 h-4" />
            <span>Offline Mode — displaying cached portfolio data.</span>
          </div>
        )}

        {/* Added pb-20 for mobile nav padding */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Floating Speed-dial Action Hub */}
      <FloatingActionHub />

      {/* Floating AI Financial Assistant */}
      <FloatingAiAssistant />

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
