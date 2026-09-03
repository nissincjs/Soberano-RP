import React from 'react';
import {
  LayoutDashboard,
  Landmark,
  Wallet,
  UserRound,
  X,
  LogOut,
  Lock,
  BriefcaseBusiness,
  Building2,
  Scale,
  Vote,
} from 'lucide-react';
import { useBrasilSoberano } from '../context/BrasilSoberanoContext';
import { Avatar } from './ui/Avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    citizen,
    logout
  } = useBrasilSoberano();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0b0d13]/95 backdrop-blur-xl border-r border-[#1e222d] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Brand */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#1e222d]/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/50 border border-white/15 ring-1 ring-emerald-400/30">
                <Landmark className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-sm text-white tracking-tight leading-none flex items-center gap-1.5">
                  Brasil Soberano
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
                  </span>
                  Sistema Governamental
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="p-3 space-y-5">
            <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Principal
              </div>
              <div className="space-y-1">
                {[
                  {
                    id: 'dashboard',
                    label: 'Dashboard',
                    icon: LayoutDashboard,
                  },
                  {
                    id: 'wallet',
                    label: 'Carteira',
                    icon: Wallet,
                  },
                  {
                    id: 'profile',
                    label: 'Meu Perfil',
                    icon: UserRound,
                  }
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                      className={`relative flex items-center w-full px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/15 via-[#151b28] to-[#131720] text-white border-emerald-500/25'
                          : 'text-slate-400 hover:text-white hover:bg-[#141720] border-transparent'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                      )}
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="ml-2.5">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Módulos futuros do RP */}
            <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Em breve
              </div>
              <div className="space-y-0.5">
                {[
                  { label: 'Emprego & Renda', icon: BriefcaseBusiness },
                  { label: 'Empresas', icon: Building2 },
                  { label: 'Eleições & Partidos', icon: Vote },
                  { label: 'Justiça & Multas', icon: Scale },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 cursor-not-allowed select-none"
                      title="Disponível em breve"
                    >
                      <Icon className="w-4 h-4 text-slate-700" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#1e222d] bg-gradient-to-t from-[#0c0e14] to-transparent">
          <div className="relative overflow-hidden rounded-xl bg-[#141720] border border-[#1e222d] p-2.5">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <Avatar
                    src={citizen.avatarUrl}
                    name={citizen.name}
                    className="w-9 h-9 rounded-xl border border-emerald-500/40"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#141720]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {citizen.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-medium">
                    {citizen.role} • {citizen.state}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Encerrar Sessão"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

