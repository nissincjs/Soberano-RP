import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Mail,
  Landmark,
  UserRound,
  RefreshCw,
  Send,
  ShieldCheck,
  AlertCircle,
  ReceiptText,
} from 'lucide-react';
import { useBrasilSoberano } from '../../context/BrasilSoberanoContext';
import { getWallet, findPixRecipient, sendPix } from '../../lib/citizenApi';
import type { WalletTransaction, PixRecipient } from '../../types';
import {
  formatBRL,
  formatDateTime,
  formatCpf,
  maskKey,
  copyToClipboard,
  parseBRLToCents,
} from '../../lib/format';

const CATEGORY_LABEL: Record<string, string> = {
  pix: 'PIX',
  deposito: 'Depósito',
};

function walletError(error?: string): string {
  switch (error) {
    case 'saldo_insuficiente':
      return 'Saldo insuficiente para este PIX.';
    case 'destinatario_nao_encontrado':
      return 'Destinatário não encontrado. Verifique a chave informada.';
    case 'auto_transferencia':
      return 'Você não pode enviar um PIX para si mesmo.';
    case 'chave_invalida':
      return 'Chave inválida. Use um CPF (com ou sem pontuação) ou um e-mail cadastrado.';
    case 'valor_invalido':
      return 'Informe um valor válido maior que zero.';
    case 'conta_nao_encontrada':
      return 'Não foi possível localizar a sua conta.';
    case 'rede':
      return 'Falha de conexão. Verifique sua internet e tente de novo.';
    default:
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}

export const WalletPage: React.FC = () => {
  const { citizen, updateCitizen, showToast } = useBrasilSoberano();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Formulário de envio
  const [keyInput, setKeyInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [recipient, setRecipient] = useState<PixRecipient | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const emailKey = useMemo(() => citizen.email ?? null, [citizen.email]);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    const result = await getWallet(citizen.id);
    setLoading(false);
    if (result.ok && result.balanceCents !== undefined) {
      setBalance(result.balanceCents);
      setTransactions(result.transactions ?? []);
      if (result.balanceCents !== citizen.balanceCents) {
        updateCitizen({ balanceCents: result.balanceCents });
      }
    } else {
      showToast(walletError(result.error), 'error');
    }
  }, [citizen.id, citizen.balanceCents, updateCitizen, showToast]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleCopy = async (value: string, label: string) => {
    const ok = await copyToClipboard(value);
    setCopiedKey(value);
    setTimeout(() => setCopiedKey(null), 1600);
    showToast(ok ? `${label} copiada!` : 'Não foi possível copiar.', ok ? 'success' : 'error');
  };

  const lookupRecipient = async (): Promise<boolean> => {
    const key = keyInput.trim();
    if (!key) {
      setFormError('Informe a chave PIX (CPF ou e-mail) do destinatário.');
      return false;
    }
    const clean = key.replace(/\D/g, '');
    if (key.includes('@')) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(key)) {
        setFormError('Informe um e-mail válido.');
        return false;
      }
    } else if (clean.length !== 11) {
      setFormError('Informe um CPF válido (11 dígitos) ou um e-mail.');
      return false;
    }
    setFormError(null);
    const result = await findPixRecipient(key);
    if (result.ok && result.recipient) {
      setRecipient(result.recipient);
      return true;
    }
    setFormError(walletError(result.error));
    return false;
  };

  const submitSend = async () => {
    if (sending) return;

    if (!recipient) {
      await lookupRecipient();
      return;
    }

    const cents = parseBRLToCents(amountInput);
    if (!cents || cents <= 0) {
      setFormError('Informe um valor válido para o PIX.');
      return;
    }
    setFormError(null);
    setSending(true);

    const result = await sendPix({
      senderId: citizen.id,
      key: keyInput.trim(),
      amountCents: cents,
      description: descriptionInput.trim(),
    });
    setSending(false);

    if (result.ok) {
      setRecipient(null);
      setKeyInput('');
      setAmountInput('');
      setDescriptionInput('');
      showToast(`PIX de ${formatBRL(cents)} enviado para ${recipient.name}!`, 'success');
      await loadWallet();
    } else {
      setFormError(walletError(result.error));
    }
  };

  const resetSend = () => {
    setRecipient(null);
    setFormError(null);
  };

  const pixKeys = useMemo(() => {
    const keys: { value: string; label: string }[] = [];
    keys.push({ value: formatCpf(citizen.cpf), label: 'CPF' });
    if (emailKey) keys.push({ value: emailKey, label: 'E-mail' });
    return keys;
  }, [citizen.cpf, emailKey]);

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>Carteira Soberana</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Saldo, chaves PIX e movimentações de{' '}
            <span className="text-slate-200 font-semibold">{citizen.name}</span>.
          </p>
        </div>
        <button
          onClick={loadWallet}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 bg-[#141720] border border-[#1e222d] hover:text-white hover:border-slate-500/40 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Saldo + Chaves */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-[#1e222d] bg-gradient-to-br from-[#0c0e14] via-[#0e1420] to-[#0a2a1e] p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            Saldo disponível
          </div>
          <div className="mt-3 text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums">
            {formatBRL(balance)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span>
              Titular: <span className="text-slate-200 font-semibold">{citizen.name}</span>
            </span>
            <span>
              CPF: <span className="font-mono text-slate-200 font-semibold">{formatCpf(citizen.cpf)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400/90 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Movimentações protegidas pelo Banco Soberano
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Minhas chaves PIX
          </div>
          <div className="space-y-2.5">
            {pixKeys.map((key) => (
              <div
                key={key.label}
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#141720] border border-[#1e222d]"
              >
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
                    {key.label === 'CPF' ? <UserRound className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                    Chave {key.label}
                  </div>
                  <div className="text-sm font-bold text-white font-mono truncate mt-0.5">
                    {key.label === 'CPF' ? formatCpf(key.value) : key.value}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(key.value, `Chave ${key.label}`)}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors shrink-0"
                  title={`Copiar chave ${key.label}`}
                >
                  {copiedKey === key.value ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            Envie ou receba dinheiro informando o CPF ou o e-mail cadastrado do cidadão.
          </p>
        </div>
      </div>

      {/* Enviar PIX + Meus dados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5 sm:p-6">
          <div className="text-sm font-black text-white flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-emerald-400" />
            Enviar PIX
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Chave do destinatário (CPF ou e-mail)
              </label>
              <input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="000.000.000-00 ou email@exemplo.gov.br"
                disabled={!!recipient || sending}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141720] border border-[#1e222d] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Valor
                </label>
                <input
                  value={amountInput}
                  onChange={(e) =>
                    setAmountInput(e.target.value.replace(/[^\d,.]/g, '').slice(0, 12))
                  }
                  placeholder="0,00"
                  inputMode="decimal"
                  disabled={sending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141720] border border-[#1e222d] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60 tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Descrição (opcional)
                </label>
                <input
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value.slice(0, 140))}
                  placeholder="Ex.: almoço, acerto..."
                  disabled={sending}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141720] border border-[#1e222d] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                {formError}
              </div>
            )}

            {recipient && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Confirme o destinatário antes de enviar
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <span className="text-white font-bold">{recipient.name}</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {recipient.state} • chave {maskKey(keyInput.trim(), recipient.keyType)}
                  </span>
                  <span className="text-emerald-300 font-black ml-auto">
                    {formatBRL(parseBRLToCents(amountInput) ?? 0)}
                  </span>
                </div>
                <button
                  onClick={resetSend}
                  className="mt-2 text-[11px] font-bold text-slate-400 hover:text-white underline underline-offset-2"
                >
                  Trocar destinatário
                </button>
              </div>
            )}

            <button
              onClick={submitSend}
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : recipient ? (
                'Confirmar PIX'
              ) : (
                'Continuar'
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5">
          <div className="text-sm font-black text-white mb-4">Meus dados</div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={citizen.avatarUrl}
                alt={citizen.name}
                className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30"
              />
              <div className="min-w-0">
                <div className="text-white font-bold truncate">{citizen.name}</div>
                <div className="text-slate-500">{citizen.role} • {citizen.state}</div>
              </div>
            </div>
            <dl className="space-y-2.5 pt-1">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">CPF</dt>
                <dd className="text-slate-200 font-mono font-semibold">{formatCpf(citizen.cpf)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Título eleitoral</dt>
                <dd className="text-slate-200 font-mono font-semibold">
                  {citizen.titleNumber ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Partido</dt>
                <dd className="text-slate-200 font-semibold">{citizen.party ?? 'Sem Partido'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Estado</dt>
                <dd className="text-slate-200 font-semibold">{citizen.state}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Extrato */}
      <div className="rounded-2xl border border-[#1e222d] bg-[#0c0e14] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[#1e222d] flex items-center justify-between">
          <div className="text-sm font-black text-white flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-emerald-400" />
            Extrato
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {transactions.length} movimentação{transactions.length === 1 ? '' : 'ões'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-[#141720] border border-[#1e222d] flex items-center justify-center mb-3">
              <ReceiptText className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-300">Nenhuma movimentação ainda</p>
            <p className="text-xs text-slate-500 mt-1">
              Seu extrato aparecerá aqui assim que houver depósitos ou PIX.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1e222d] max-h-[420px] overflow-y-auto">
            {transactions.map((tx) => {
              const isIn = tx.direction === 'in';
              return (
                <li key={tx.id} className="px-5 sm:px-6 py-3.5 flex items-center gap-3.5 hover:bg-[#0e1118] transition-colors">
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${
                      isIn
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {isIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
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
                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-black tabular-nums ${
                        isIn ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIn ? '+' : '−'} {formatBRL(tx.amountCents)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

