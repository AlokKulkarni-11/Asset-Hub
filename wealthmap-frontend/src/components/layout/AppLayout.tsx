import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden relative">
      <div className="bg-orb-gold" />
      <div className="bg-orb-blue" />
      
      {/* Sidebar spacer for layout */}
      <div className="hidden md:block w-20 shrink-0 border-r border-transparent" />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar actual (Hover to expand on desktop, full width on mobile) */}
      <Sidebar 
        className={`flex flex-col absolute left-0 top-0 bottom-0 
          md:w-20 md:hover:w-64 transition-all duration-300 border-r border-white/10 
          bg-navy-900/95 backdrop-blur-xl z-50 overflow-hidden group shadow-2xl shadow-navy-950
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}`}
        onLinkClick={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        
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
