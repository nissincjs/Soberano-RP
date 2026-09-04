import React, { useState } from 'react';
import { Landmark, Lock, Eye, EyeOff, KeyRound, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { useBrasilSoberano } from '../../context/BrasilSoberanoContext';
import { GlassInputWrapper } from '../ui/sign-in';

export const ResetPasswordView: React.FC = () => {
  const { submitPasswordReset, cancelPasswordReset } = useBrasilSoberano();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (newPassword.length < 6) {
      setError('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }

    setError(null);
    setSubmitting(true);
    const ok = await submitPasswordReset(newPassword);
    setSubmitting(false);
    if (!ok) setError('Não foi possível redefinir a senha. Tente novamente.');
  };

  return (
    <div className="min-h-screen flex w-full bg-[#08090d] text-slate-100 relative">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e222d15_1px,transparent_1px),linear-gradient(to_bottom,#1e222d15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col justify-center px-6 py-10">
        {/* Top Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 border border-white/20">
            <Landmark className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white tracking-tight">Brasil Soberano RP</span>
            <p className="text-[11px] text-slate-400">Portal de Identidade Cívica e Simulação</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Redefinir senha
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Escolha uma nova senha segura para a sua conta de cidadão.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex items-center gap-3">
            <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Link de recuperação validado. Defina a nova senha para liberar o acesso.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Nova senha</label>
            <GlassInputWrapper>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres..."
                  className="w-full bg-transparent text-sm p-3.5 pl-11 pr-12 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </GlassInputWrapper>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Confirmar nova senha</label>
            <GlassInputWrapper>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-transparent text-sm p-3.5 pl-11 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </GlassInputWrapper>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-3.5 font-bold text-sm text-slate-950 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span>Definir nova senha</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={cancelPasswordReset}
            className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancelar e voltar ao login
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          Sua senha é criptografada e nunca é armazenada em texto puro.
        </div>
      </div>
    </div>
  );
};
