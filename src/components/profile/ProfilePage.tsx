import React, { useEffect, useState } from 'react';
import {
  UserRound,
  Save,
  RefreshCw,
  AlertCircle,
  Mail,
  ShieldCheck,
  Lock,
  MapPin,
  Phone,
  Sparkles,
  IdCard,
  Camera,
  BadgeCheck,
} from 'lucide-react';
import { useBrasilSoberano } from '../../context/BrasilSoberanoContext';
import { updateCitizenProfile, changePassword } from '../../lib/citizenApi';
import { Avatar } from '../ui/Avatar';
import { PageHeader } from '../ui/PageHeader';
import { formatCpf } from '../../lib/format';

const BIO_MAX = 280;

const SUGGESTED_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=80',
];

function profileError(error?: string): string {
  switch (error) {
    case 'nome_obrigatorio':
      return 'Informe seu nome completo.';
    case 'rede':
      return 'Falha de conexão. Verifique sua internet e tente de novo.';
    default:
      return 'Não foi possível salvar as alterações. Tente novamente.';
  }
}

function passwordError(error?: string): string {
  switch (error) {
    case 'senha_incorreta':
      return 'Senha atual incorreta. Verifique e tente novamente.';
    case 'senha_curta':
      return 'A nova senha deve ter ao menos 4 caracteres.';
    case 'nao_encontrado':
      return 'Não foi possível localizar a sua conta.';
    case 'rede':
      return 'Falha de conexão. Verifique sua internet e tente de novo.';
    default:
      return 'Não foi possível alterar a senha. Tente novamente.';
  }
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-[#141720] border border-[#1e222d] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60';

const labelClass =
  'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

export const ProfilePage: React.FC = () => {
  const { citizen, updateCitizen, showToast, states } = useBrasilSoberano();

  const [name, setName] = useState(citizen.name ?? '');
  const [phone, setPhone] = useState(citizen.phone ?? '');
  const [city, setCity] = useState(citizen.city ?? '');
  const [state, setState] = useState(citizen.state ?? 'DF');
  const [bio, setBio] = useState(citizen.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(citizen.avatarUrl ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    setName(citizen.name ?? '');
    setPhone(citizen.phone ?? '');
    setCity(citizen.city ?? '');
    setState(citizen.state ?? 'DF');
    setBio(citizen.bio ?? '');
    setAvatarUrl(citizen.avatarUrl ?? '');
  }, [citizen.id]);

  const applyProfile = async () => {
    if (saving) return;

    if (!name.trim()) {
      setFormError('Informe seu nome completo.');
      return;
    }
    setFormError(null);
    setSaving(true);

    const result = await updateCitizenProfile(citizen.id, {
      name: name.trim(),
      avatarUrl: avatarUrl.trim(),
      state: state.trim(),
      city: city.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
    });
    setSaving(false);

    if (result.ok && result.citizen) {
      const c = result.citizen;
      updateCitizen({
        name: c.name,
        avatarUrl: c.avatarUrl ?? '',
        state: c.state,
        city: c.city ?? '',
        bio: c.bio ?? '',
        phone: c.phone ?? '',
        email: c.email,
        role: c.role,
        party: c.party,
        titleNumber: c.titleNumber,
        balanceCents: c.balanceCents,
        createdAt: c.createdAt,
      });
      setName(c.name);
      setPhone(c.phone ?? '');
      setCity(c.city ?? '');
      setState(c.state);
      setBio(c.bio ?? '');
      setAvatarUrl(c.avatarUrl ?? '');
      showToast('Perfil atualizado com sucesso!', 'success');
    } else {
      setFormError(profileError(result.error));
    }
  };

  const applyPassword = async () => {
    if (changingPw) return;
    setPwSuccess(false);

    if (!currentPassword) {
      setPwError('Informe sua senha atual.');
      return;
    }
    if (newPassword.length < 4) {
      setPwError('A nova senha deve ter ao menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('A confirmação não confere com a nova senha.');
      return;
    }
    setPwError(null);
    setChangingPw(true);

    const result = await changePassword({
      id: citizen.id,
      currentPassword,
      newPassword,
    });
    setChangingPw(false);

    if (result.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSuccess(true);
      showToast('Senha alterada com sucesso!', 'success');
    } else {
      setPwError(passwordError(result.error));
    }
  };

  const createdAtLabel = citizen.createdAt
    ? new Date(citizen.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <PageHeader
        icon={UserRound}
        title="Meu Perfil"
        description="Gerencie seus dados pessoais, foto e segurança da conta."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal: edição */}
        <div className="lg:col-span-2 space-y-6">
          {/* Foto do perfil */}
          <div className="rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5 sm:p-6">
            <div className="text-sm font-black text-white flex items-center gap-2 mb-5">
              <Camera className="w-4 h-4 text-emerald-400" />
              Foto do perfil
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 flex flex-col items-center gap-3">
                <Avatar
                  src={avatarUrl.trim() || null}
                  name={name || citizen.name}
                  className="w-24 h-24 rounded-2xl border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/30"
                  initialsClassName="text-3xl"
                />
                <button
                  onClick={() => setAvatarUrl('')}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-colors underline underline-offset-2"
                >
                  Remover foto
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <label className={labelClass}>URL da imagem</label>
                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://.../minha-foto.jpg"
                    className={`${inputClass} font-mono`}
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Cole o endereço de uma imagem sua. Sem foto, usamos suas iniciais.
                  </p>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Sugestões de retrato
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {SUGGESTED_AVATARS.map((url) => (
                      <button
                        key={url}
                        onClick={() => setAvatarUrl(url)}
                        title="Usar este avatar"
                        className={`rounded-xl overflow-hidden transition-all ${
                          avatarUrl.trim() === url
                            ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0c0e14]'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Avatar
                          src={url}
                          name={name || citizen.name}
                          className="w-12 h-12"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5 sm:p-6">
            <div className="text-sm font-black text-white flex items-center gap-2 mb-5">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              Dados pessoais
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nome completo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome civil"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Cidade</label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cidade de residência"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Estado (UF)</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {states
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                      .map((s) => (
                        <option key={s.uf} value={s.uf}>
                          {s.uf} — {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Telefone</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Biografia
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      bio.length > BIO_MAX ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  >
                    {bio.length}/{BIO_MAX}
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  placeholder="Conte um pouco sobre você (cargo, história, planos na República)..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={applyProfile}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna lateral: identidade + segurança */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5">
            <div className="text-sm font-black text-white flex items-center gap-2 mb-4">
              <IdCard className="w-4 h-4 text-emerald-400" />
              Identidade
            </div>
            <dl className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center gap-3">
                <dt className="text-slate-500">CPF</dt>
                <dd className="text-slate-200 font-mono font-semibold">
                  {formatCpf(citizen.cpf)}
                </dd>
              </div>
              <div className="flex justify-between items-center gap-3">
                <dt className="text-slate-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> E-mail da conta
                </dt>
                <dd className="text-slate-200 font-semibold flex items-center gap-1.5 truncate">
                  <span className="truncate max-w-[150px]">{citizen.email ?? '—'}</span>
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" title="Não é possível alterar o e-mail" />
                </dd>
              </div>
              <div className="flex justify-between items-center gap-3">
                <dt className="text-slate-500">Título eleitoral</dt>
                <dd className="text-slate-200 font-mono font-semibold">
                  {citizen.titleNumber ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between items-center gap-3">
                <dt className="text-slate-500">Partido</dt>
                <dd className="text-slate-200 font-semibold">{citizen.party ?? 'Sem Partido'}</dd>
              </div>
              <div className="flex justify-between items-center gap-3">
                <dt className="text-slate-500">Cargo</dt>
                <dd className="text-slate-200 font-semibold">{citizen.role ?? 'Cidadão'}</dd>
              </div>
              <div className="flex justify-between items-center gap-3">
                <dt className="text-slate-500">Cidadão desde</dt>
                <dd className="text-slate-200 font-semibold">{createdAtLabel}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 border-t border-[#1e222d] pt-3.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              CPF e e-mail são suas chaves PIX e credenciais de acesso — por isso não podem ser alterados.
            </div>
          </div>

          <div className="rounded-2xl border border-[#1e222d] bg-[#0c0e14] p-5">
            <div className="text-sm font-black text-white flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-emerald-400" />
              Segurança
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Senha atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nova senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className={inputClass}
                />
              </div>

              {pwError && (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3.5 py-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  Senha atualizada. Use a nova senha no próximo acesso.
                </div>
              )}

              <button
                onClick={applyPassword}
                disabled={changingPw}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPw ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Alterar senha
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
