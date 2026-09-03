import React from 'react';
import { PanelLeft, PanelLeftClose, LogOut, Wallet, ChevronRight } from 'lucide-react';
import { useBrasilSoberano } from '../context/BrasilSoberanoContext';
import { Avatar } from './ui/Avatar';
import { formatBRL } from '../lib/format';

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
    <header className="sticky top-0 z-30 h-16 w-full bg-[#090a0f]/75 backdrop-blur-xl border-b border-[#1e222d]/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: Sidebar toggle and page title */}
      <div className="flex items-center gap-3">
        <button
          id="topbar-toggle-sidebar"
          type="button"
          onClick={onToggleSidebar}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
            sidebarOpen
              ? 'text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 ring-1 ring-emerald-500/25'
              : 'text-slate-400 hover:text-white hover:bg-[#141720]'
          }`}
          title={sidebarOpen ? "Recolher Menu Lateral" : "Expandir Menu Lateral"}
          aria-label="Alternar Menu Lateral"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Painel</span>
          <ChevronRight className="w-3 h-3 text-slate-600 hidden sm:inline" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-tight">{current.title}</span>
            <span className="text-xs text-slate-500 font-mono hidden md:inline">| {current.subtitle}</span>
          </div>
        </div>
      </div>

      {/* Right side: Saldo, Citizen Info & Logout */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveTab('wallet')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1e222d] bg-[#0c0e14]/70 hover:border-emerald-500/40 hover:bg-[#141720] transition-all cursor-pointer group"
          title="Ver minha carteira"
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-black text-white tabular-nums tracking-tight">
            {formatBRL(citizen.balanceCents)}
          </span>
        </button>

        <div className="w-px h-6 bg-[#1e222d] hidden sm:block" />

        <button
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2.5 pl-2 rounded-lg hover:bg-[#141720] transition-colors cursor-pointer"
          title="Ver meu perfil"
        >
          <div className="relative">
            <Avatar
              src={citizen.avatarUrl}
              name={citizen.name}
              className="w-8 h-8 rounded-lg border border-emerald-500/30"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090a0f]" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-white leading-tight truncate max-w-[150px]">
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

