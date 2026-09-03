import React from 'react';
import {
  LayoutDashboard,
  Landmark,
  Wallet,
  UserRound,
  X,
  LogOut
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
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0c0e14] border-r border-[#1e222d] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Brand */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#1e222d]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 border border-white/10">
                <Landmark className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-white tracking-tight leading-none flex items-center gap-1.5">
                  Brasil Soberano
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Painel Governamental
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
          <div className="p-3 space-y-4">
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
                    dotClass: 'bg-emerald-400',
                    iconActiveClass: 'text-emerald-400'
                  },
                  {
                    id: 'wallet',
                    label: 'Carteira',
                    icon: Wallet,
                    dotClass: 'bg-emerald-400',
                    iconActiveClass: 'text-emerald-400'
                  },
                  {
                    id: 'profile',
                    label: 'Meu Perfil',
                    icon: UserRound,
                    dotClass: 'bg-emerald-400',
                    iconActiveClass: 'text-emerald-400'
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
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#1e222d] text-white shadow-sm border border-white/10'
                          : 'text-slate-400 hover:text-white hover:bg-[#141720] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${isActive ? item.iconActiveClass : 'text-slate-500'}`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <span className={`w-1.5 h-1.5 rounded-full ${item.dotClass}`}></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#1e222d] bg-[#0c0e14]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#141720] border border-[#1e222d]">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar
                src={citizen.avatarUrl}
                name={citizen.name}
                className="w-8 h-8 rounded-lg border border-emerald-500/40 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {citizen.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  CPF: {citizen.cpf} • {citizen.state}
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
      </aside>
    </>
  );
};

