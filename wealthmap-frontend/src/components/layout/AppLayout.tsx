import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
        className="hidden md:flex flex-col absolute left-0 top-0 bottom-0 w-20 hover:w-64 transition-all duration-300 border-r border-border bg-surface backdrop-blur-xl z-50 overflow-hidden group shadow-2xl shadow-slate-200"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        <Topbar />
        
        {/* Added pb-20 for mobile nav padding */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
