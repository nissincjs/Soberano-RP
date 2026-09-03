import React, { useState } from 'react';
import { BrasilSoberanoProvider, useBrasilSoberano } from './context/BrasilSoberanoContext';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { LoginPage } from './components/auth/LoginPage';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { WalletPage } from './components/wallet/WalletPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const {
    toastMessage,
    isAuthenticated,
    authLoading,
    activeTab
  } = useBrasilSoberano();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08090d] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Acessando Sistema Soberano...</p>
      </div>
    );
  }

  // If citizen is not logged in, render the login & onboarding portal
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
            <div className={`px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2.5 border backdrop-blur-xl ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : toastMessage.type === 'info'
                ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}>
              {toastMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : toastMessage.type === 'info' ? (
                <Info className="w-4 h-4 text-cyan-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Sleek Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main App Layout (offset left by sidebar on desktop when open) */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
        {/* 2. Top Header Bar */}
        <TopNavbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        {/* 3. Main Workspace Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'wallet' ? <WalletPage /> : activeTab === 'profile' ? <ProfilePage /> : <ExecutiveDashboard />}
        </main>

        {/* Minimalist Dashboard Footer */}
        <footer className="border-t border-[#1e222d] bg-[#0c0e14] py-4 px-6 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Brasil Soberano</span>
            <span>•</span>
            <span>Painel Governamental</span>
          </div>
        </footer>
      </div>

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div className={`px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2.5 border backdrop-blur-xl ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : toastMessage.type === 'info'
              ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : toastMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-cyan-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrasilSoberanoProvider>
      <DashboardContent />
    </BrasilSoberanoProvider>
  );
}

