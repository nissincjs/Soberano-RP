import React, { useCallback, useEffect, useState } from 'react';
import {
  Wallet,
  Send,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  BadgeCheck,
  CalendarDays,
  MapPin,
  ChevronRight,
  Sparkles,
  Landmark,
  UserRound,
  IdCard,
} from 'lucide-react';
import { useBrasilSoberano } from '../../context/BrasilSoberanoContext';
import { getWallet } from '../../lib/citizenApi';
import { Avatar } from '../ui/Avatar';
import type { WalletTransaction } from '../../types';
import { formatBRL, formatDateTime } from '../../lib/format';

const UPCOMING_MODULES = [
  {
    icon: Landmark,
    title: 'Governo',
    description: 'Leis, orçamento e obras por UF',
    tag: 'Em desenvolvimento',
  },
  {
    icon: BadgeCheck,
    title: 'Eleições',
    description: 'Vereador, prefeito, governador e presidente',
    tag: 'Em breve',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança',
    description: 'Polícia, multas e justiça',
    tag: 'Em breve',
  },
  {
    icon: Sparkles,
    title: 'Eventos & NPCs',
    description: 'Cenas com IA na República',
    tag: 'Futuro',
  },
];

const CATEGORY_LABEL: Record<string, string> = {
  pix: 'PIX',
  deposito: 'Depósito',
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayLabel(): string {
  const parts = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return parts.charAt(0).toUpperCase() + parts.slice(1);
}

function daysSince(ts?: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const days = Math.max(0, Math.floor(diff / 86_400_000));
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Há 1 dia';
  return `Há ${days} dias`;
}

export const ExecutiveDashboard: React.FC = () => {
  const { citizen, states, setActiveTab } = useBrasilSoberano();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    const result = await getWallet(citizen.id);
    setLoading(false);
    if (result.ok) {
      setBalance(result.balanceCents ?? 0);
      setTransactions(result.transactions ?? []);
    }
  }, [citizen.id]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const stateName =
    states.find((s) => s.uf === citizen.state)?.name ?? citizen.state;
  const location = citizen.city ? `${citizen.city} — ${stateName}` : stateName;
  const firstWord = (citizen.name ?? '').split(' ')[0];
  const recent = transactions.slice(0, 4);

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Welcome header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400/90">
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            Painel do Cidadão
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-black text-white tracking-tight">
            {greeting()}, <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">{firstWord}</span>.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              {todayLabel()}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {location}
            </span>
          </p>
        </div>
      </div>

      {/* Hero: saldo + cidadão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Saldo */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-[#1e222d] bg-gradient-to-br from-[#0c0e14] via-[#0e1624] to-[#0a2a1e] p-6">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -left-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                <Landmark className="w-4 h-4 text-emerald-400" />
                Saldo disponível
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25">
                <ShieldCheck className="w-3 h-3" />
                Banco Soberano
              </span>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="h-12 w-64 max-w-full rounded-lg bg-white/5 animate-pulse" />
              ) : (
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums drop-shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                  {formatBRL(balance)}
                </div>
              )}
            </div>

            <p className="mt-2 text-[11px] text-slate-400 font-mono">
              Titular: {citizen.name} • CPF {citizen.cpf}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('wallet')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 shadow-lg shadow-emerald-950/50 transition-all"
              >
                <Send className="w-4 h-4" />
                Enviar PIX
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 bg-[#141720] border border-[#1e222d] hover:border-emerald-500/40 hover:text-white transition-all"
              >
                <ReceiptText className="w-4 h-4 text-emerald-400" />
                Ver extrato
              </button>
            </div>
          </div>
        </div>

        {/* Cidadão */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5 card-glow">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <Avatar
                src={citizen.avatarUrl}
                name={citizen.name}
                className="w-14 h-14 rounded-2xl border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/40"
                initialsClassName="text-xl"
              />
              <div className="min-w-0">
                <div className="text-sm font-black text-white truncate">{citizen.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{citizen.role || 'Cidadão'} • {citizen.state}</span>
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-xs">
              <div className="flex justify-between gap-3 items-center">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5" /> Partido
                </dt>
                <dd className="text-slate-200 font-semibold">{citizen.party || 'Sem Partido'}</dd>
              </div>
              <div className="flex justify-between gap-3 items-center">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Residência
                </dt>
                <dd className="text-slate-200 font-semibold text-right">{location}</dd>
              </div>
              <div className="flex justify-between gap-3 items-center">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Cidadão desde
                </dt>
                <dd className="text-slate-200 font-semibold">{daysSince(citizen.createdAt)}</dd>
              </div>
            </dl>

            <button
              onClick={() => setActiveTab('profile')}
              className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 bg-[#141720] border border-[#1e222d] hover:text-emerald-300 hover:border-emerald-500/40 transition-all"
            >
              <UserRound className="w-3.5 h-3.5" />
              Gerenciar meu perfil
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Últimas movimentações + módulos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Extrato resumido */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1e222d] bg-[#0c0e14] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e222d] flex items-center justify-between">
            <div className="text-sm font-black text-white flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-emerald-400" />
              Últimas movimentações
            </div>
            <button
              onClick={() => setActiveTab('wallet')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Ver tudo
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-11 h-11 rounded-2xl bg-[#141720] border border-[#1e222d] flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm font-bold text-slate-300">Nenhuma movimentação ainda</p>
              <p className="text-xs text-slate-500 mt-1">
                Seus PIX e depósitos aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#1e222d]/70">
              {recent.map((tx) => {
                const isIn = tx.direction === 'in';
                return (
                  <li
                    key={tx.id}
                    onClick={() => setActiveTab('wallet')}
                    className="px-5 py-3.5 flex items-center gap-3.5 cursor-pointer hover:bg-[#0e1118] transition-colors"
                  >
                    <div
                      className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center ${
                        isIn
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {isIn ? (
                        <ArrowDownLeft className="w-4.5 h-4.5" />
                      ) : (
                        <ArrowUpRight className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">
                        {isIn ? 'Recebido de ' : 'Enviado para '}
                        <span className="text-slate-300 font-semibold">{tx.counterpartyName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {CATEGORY_LABEL[tx.category] ?? tx.category}
                        {tx.description ? ` • ${tx.description}` : ''}
                        {' • '}
                        {formatDateTime(tx.createdAt)}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-black tabular-nums shrink-0 ${
                        isIn ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIn ? '+' : '−'} {formatBRL(tx.amountCents)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Módulos em construção */}
        <div className="rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5">
          <div className="text-sm font-black text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            República em expansão
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            Novos módulos da vida e da política estão sendo construídos.
          </p>
          <div className="space-y-2.5">
            {UPCOMING_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.title}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#141720] border border-[#1e222d]"
                >
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-200">{module.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      {module.description}
                    </div>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-amber-400/80 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    {module.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
