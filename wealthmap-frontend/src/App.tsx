import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider';
import api from './api/axios';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Family from './pages/Family';
import Calculators from './pages/Calculators';
import Profile from './pages/Profile';
import Liabilities from './pages/Liabilities';
import Goals from './pages/Goals';
import { AiAssistantPage } from './pages/AiAssistantPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { ErrorBoundary } from './components/ErrorBoundary';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';
import { usePageMeta } from './hooks/usePageMeta';
import { useAuthStore } from './store/authStore';

function AppContent() {
  usePageMeta();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Proactively pre-warm Render cloud backend on app load if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      api.get('/auth/ping').catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      
      {/* Root Route: If authenticated -> Dashboard in AppLayout; else -> LandingPage */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <AppLayout />
          ) : (
            <LandingPage />
          )
        }
      >
        <Route index element={<Dashboard />} />
      </Route>

      {/* Protected Application Routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/liabilities" element={<Liabilities />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/assistant" element={<AiAssistantPage />} />
        <Route path="/family" element={<Family />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/maturities" element={<Navigate to="/goals?tab=maturities" replace />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
