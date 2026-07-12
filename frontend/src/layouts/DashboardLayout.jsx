import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { NotificationToastContainer } from '../components/NotificationToast';

export const DashboardLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          {/* Skeleton Pulse */}
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
            Loading Session...
          </span>
        </div>
      </div>
    );
  }

  // Route Guard
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main dashboard viewport */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic sub-routing pages view */}
        <main className="flex-grow overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

      {/* Dynamic Toast overlays */}
      <NotificationToastContainer />
    </div>
  );
};
