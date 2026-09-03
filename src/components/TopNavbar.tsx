import React from 'react';
import { PanelLeft, LogOut } from 'lucide-react';
import { useBrasilSoberano } from '../context/BrasilSoberanoContext';
import { Avatar } from './ui/Avatar';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { citizen, logout, activeTab, setActiveTab } = useBrasilSoberano();

  const pageTitle: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Painel Principal' },
    wallet: { title: 'Carteira', subtitle: 'Financeiro do Cidadão' },
    profile: { title: 'Meu Perfil', subtitle: 'Configurações do Cidadão' },
  };
  const current = pageTitle[activeTab] ?? { title: 'Dashboard', subtitle: 'Painel Principal' };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#090a0f]/90 backdrop-blur-xl border-b border-[#1e222d] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: Sidebar toggle and page title */}
      <div className="flex items-center gap-3">
        <button
          id="topbar-toggle-sidebar"
          type="button"
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg transition-all border ${
            sidebarOpen
              ? 'text-emerald-400 bg-[#141720] border-emerald-500/40 hover:bg-[#1a1f2c]'
              : 'text-slate-400 hover:text-white hover:bg-[#141720] border-[#1e222d]'
          }`}
          title={sidebarOpen ? "Recolher Menu Lateral" : "Expandir Menu Lateral"}
          aria-label="Alternar Menu Lateral"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white">{current.title}</span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">| {current.subtitle}</span>
        </div>
      </div>

      {/* Right side: Citizen Info & Logout */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2.5 pl-2 rounded-lg hover:bg-[#141720] transition-colors cursor-pointer"
          title="Ver meu perfil"
        >
          <Avatar
            src={citizen.avatarUrl}
            name={citizen.name}
            className="w-8 h-8 rounded-lg border border-[#1e222d]"
          />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-white leading-tight">
              {citizen.name}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {citizen.role || 'Cidadão'} • {citizen.state}
            </div>
          </div>
        </button>

        <button
          onClick={logout}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-[#1e222d] transition-all"
          title="Sair da Conta"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

