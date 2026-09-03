import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useBrasilSoberano } from '../../context/BrasilSoberanoContext';

export const ExecutiveDashboard: React.FC = () => {
  const { citizen } = useBrasilSoberano();

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Dashboard Header */}
      <div className="border-b border-[#1e222d] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-emerald-400" />
            <span>Painel Principal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bem-vindo(a), <span className="text-slate-200 font-semibold">{citizen.name}</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
