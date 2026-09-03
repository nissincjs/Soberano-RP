import React, { useState, useRef, useEffect } from 'react';
import {
  Landmark,
  User,
  KeyRound,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Dices,
  Mail,
  UserPlus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { useBrasilSoberano } from '../../context/BrasilSoberanoContext';
import { GoogleIcon, GlassInputWrapper } from '../ui/sign-in';

export const LoginPage: React.FC = () => {
  const {
    login,
    registerCitizen,
    states
  } = useBrasilSoberano();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Register Form States
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regCpf, setRegCpf] = useState<string>('');
  const [regState, setRegState] = useState<string>('DF');
  const [regPassword, setRegPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // State Selection Panel States
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState<boolean>(false);
  const [stateSearchQuery, setStateSearchQuery] = useState<string>('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('Todas');
  const stateDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setIsStateDropdownOpen(false);
      }
    };
    if (isStateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStateDropdownOpen]);

  const selectedStateObj = states.find(s => s.uf === regState) || states[0];
  const regionTabs = ['Todas', 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'];

  const filteredStates = states
    .filter(s => {
      const q = stateSearchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.uf.toLowerCase().includes(q) ||
        (s.capital && s.capital.toLowerCase().includes(q));
      const matchesRegion = selectedRegionFilter === 'Todas' || s.region === selectedRegionFilter;
      return matchesSearch && matchesRegion;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // CPF Formatter & Random Generator
  const formatCPF = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const generateRandomCPF = () => {
    const n = () => Math.floor(Math.random() * 10);
    const generated = `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
    setRegCpf(generated);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginIdentifier, loginPassword);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerCitizen({
      name: regName,
      email: regEmail,
      cpf: regCpf,
      state: regState,
      party: 'Sem Partido',
      password: regPassword
    });
  };

  const handleGovAuth = () => {
    login();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-[#08090d] text-slate-100 overflow-hidden relative">
      {/* Ambient background tactical grid & lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e222d15_1px,transparent_1px),linear-gradient(to_bottom,#1e222d15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Left column: Sign-in / Registration Form */}
      <section className="flex-1 flex flex-col justify-between p-6 sm:p-12 z-10 overflow-y-auto max-h-screen">
        {/* Top Branding */}
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 border border-white/20">
              <Landmark className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-tight">Brasil Soberano RP</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GOV.RP
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Portal de Identidade Cívica e Simulação</p>
            </div>
          </div>
        </div>

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="animate-element animate-delay-100 text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {mode === 'login' ? 'Acesse seu Terminal' : 'Registro de Cidadão'}
              </h1>
              <p className="animate-element animate-delay-200 text-sm text-slate-400 mt-1">
                {mode === 'login'
                  ? 'Informe seu e-mail ou CPF cadastrado para entrar na simulação.'
                  : 'Cadastre sua identidade e inicie sua jornada como Cidadão da República.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="animate-element animate-delay-200 flex bg-[#12151e] p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                id="tab-login-btn"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Acessar (Login)</span>
              </button>

              <button
                type="button"
                id="tab-register-btn"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo Cadastro</span>
              </button>
            </div>

            {mode === 'login' ? (
              /* LOGIN FORM */
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="animate-element animate-delay-300">
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">E-mail ou CPF</label>
                  <GlassInputWrapper>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-500 absolute left-4" />
                      <input
                        name="identifier"
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={e => setLoginIdentifier(e.target.value)}
                        placeholder="Digite seu e-mail ou CPF (ex: 000.000.000-00)"
                        className="w-full bg-transparent text-sm p-3.5 pl-11 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </GlassInputWrapper>
                </div>

                <div className="animate-element animate-delay-400">
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Senha de Acesso</label>
                  <GlassInputWrapper>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-4" />
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Sua senha secreta"
                        className="w-full bg-transparent text-sm p-3.5 pl-11 pr-12 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 flex items-center text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>

                <div className="animate-element animate-delay-500 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-emerald-500 focus:ring-0"
                    />
                    <span>Manter conectado neste terminal</span>
                  </label>
                </div>

                <button
                  type="submit"
                  id="submit-login-btn"
                  className="animate-element animate-delay-600 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-3.5 font-bold text-sm text-slate-950 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Entrar no Sistema Soberano</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
                <div className="animate-element animate-delay-300">
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Nome Completo Civil</label>
                  <GlassInputWrapper>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Digite seu nome civil..."
                      className="w-full bg-transparent text-sm p-3 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </GlassInputWrapper>
                </div>

                <div className="animate-element animate-delay-320">
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">E-mail de Acesso</label>
                  <GlassInputWrapper>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-4" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full bg-transparent text-sm p-3 pl-11 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </GlassInputWrapper>
                </div>

                <div className="animate-element animate-delay-350">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">CPF do Cidadão</label>
                    <button
                      type="button"
                      onClick={generateRandomCPF}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Gerar CPF</span>
                    </button>
                  </div>
                  <GlassInputWrapper>
                    <input
                      type="text"
                      required
                      value={regCpf}
                      onChange={e => setRegCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full bg-transparent text-sm p-3 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none font-mono"
                    />
                  </GlassInputWrapper>
                </div>

                <div className={`animate-element animate-delay-400 relative ${isStateDropdownOpen ? 'z-50' : 'z-20'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Estado / UF de Residência</label>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{selectedStateObj?.region || 'Federação'}</span>
                    </span>
                  </div>
                  <GlassInputWrapper className={`transition-all ${isStateDropdownOpen ? 'relative z-50 border-emerald-500/50 bg-[#0d121b]' : ''}`}>
                    <div className={`relative ${isStateDropdownOpen ? 'z-50' : ''}`} ref={stateDropdownRef}>
                      {/* Interactive Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsStateDropdownOpen(prev => !prev)}
                        className="w-full flex items-center justify-between p-3 pl-11 pr-4 rounded-2xl text-left bg-transparent text-sm focus:outline-none transition-all group cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-emerald-400 absolute left-4 group-hover:scale-110 transition-transform" />
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 shrink-0">
                            {selectedStateObj?.uf || regState}
                          </span>
                          <span className="text-white font-medium text-sm truncate">
                            {selectedStateObj?.name || 'Selecione seu Estado'}
                          </span>
                          {selectedStateObj?.capital && (
                            <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
                              • Cap: {selectedStateObj.capital}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isStateDropdownOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-white'}`} />
                      </button>

                      {/* Synced select element for HTML compatibility and direct selector matching */}
                      <select
                        value={regState}
                        onChange={e => setRegState(e.target.value)}
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        {states.map(s => (
                          <option key={s.uf} value={s.uf}>
                            {s.uf} - {s.name}
                          </option>
                        ))}
                      </select>

                      {/* Solid & High-Contrast State Selection Panel */}
                      {isStateDropdownOpen && (
                        <div
                          className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#0b0f17] border border-slate-700/90 p-3.5 shadow-2xl shadow-black ring-1 ring-white/10 animate-fadeIn"
                          style={{ backgroundColor: '#0b0f17', opacity: 1 }}
                        >
                          {/* Search Bar */}
                          <div className="relative mb-3">
                            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={stateSearchQuery}
                              onChange={e => setStateSearchQuery(e.target.value)}
                              placeholder="Buscar por estado, UF ou capital..."
                              className="w-full bg-[#141924] border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                              autoFocus
                            />
                          </div>

                          {/* Region Filter Chips */}
                          <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 scrollbar-none text-[11px]">
                            {regionTabs.map(region => (
                              <button
                                key={region}
                                type="button"
                                onClick={() => setSelectedRegionFilter(region)}
                                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                                  selectedRegionFilter === region
                                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                                    : 'bg-[#141924] text-slate-300 hover:text-white hover:bg-[#1e2533] border border-slate-700'
                                }`}
                              >
                                {region}
                              </button>
                            ))}
                          </div>

                          {/* Info counter */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pb-1.5 mb-1 border-b border-slate-800">
                            <span>{filteredStates.length} {filteredStates.length === 1 ? 'estado' : 'estados'} {selectedRegionFilter !== 'Todas' ? `(${selectedRegionFilter})` : ''}</span>
                            <span className="text-emerald-400 font-semibold">{states.length} UFs do Brasil</span>
                          </div>

                          {/* States List */}
                          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                            {filteredStates.map(s => {
                              const isSelected = s.uf === regState;
                              return (
                                <button
                                  key={s.uf}
                                  type="button"
                                  onClick={() => {
                                    setRegState(s.uf);
                                    setIsStateDropdownOpen(false);
                                    setStateSearchQuery('');
                                  }}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                                    isSelected
                                      ? 'bg-emerald-950 border border-emerald-500/80 text-white shadow-sm'
                                      : 'bg-[#131722] hover:bg-[#1a2130] text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold shrink-0 ${
                                      isSelected
                                        ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                        : 'bg-[#1b2230] text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {s.uf}
                                    </span>
                                    <div className="truncate">
                                      <span className="text-xs font-semibold text-white block truncate">{s.name}</span>
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        {s.capital ? `Capital: ${s.capital}` : s.region} • {s.region}
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                </button>
                              );
                            })}
                            {filteredStates.length === 0 && (
                              <div className="text-center py-6 text-xs text-slate-400 bg-[#131722] rounded-xl border border-slate-800">
                                Nenhum estado encontrado para "{stateSearchQuery}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassInputWrapper>
                </div>

                <div className="animate-element animate-delay-450">
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Senha Segura</label>
                  <GlassInputWrapper>
                    <div className="relative flex items-center">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres..."
                        className="w-full bg-transparent text-sm p-3 pr-12 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-4 flex items-center text-slate-400 hover:text-white"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>

                <button
                  type="submit"
                  id="submit-register-btn"
                  className="animate-element animate-delay-500 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-3.5 font-bold text-sm text-slate-950 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Emitir Título de Cidadão & Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="animate-element animate-delay-700 relative flex items-center justify-center my-0.5">
              <span className="w-full border-t border-white/10"></span>
              <span className="px-3 text-xs text-slate-500 bg-[#08090d] absolute">Ou continue com</span>
            </div>

            <button
              type="button"
              onClick={handleGovAuth}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] rounded-2xl py-3 text-xs font-semibold text-white transition-all"
            >
              <GoogleIcon />
              <span>Acesso Rápido com Gov.br</span>
            </button>
          </div>
        </div>


      </section>

      {/* Right column: hero image + testimonials */}
      <section className="hidden md:block flex-1 relative p-4 m-2">
        <div
          className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center overflow-hidden shadow-2xl"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=2160&q=80')`
          }}
        >
          {/* Dark gradient filter */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 border-none" />
          
          {/* Hero Content Overlay */}
          <div className="absolute top-10 left-10 right-10 z-10 space-y-2 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulação Institucional Realista</span>
            </div>
            <h2 className="text-2xl font-black text-white leading-snug drop-shadow-md">
              Identidade Cívica & Gestão Governamental
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed drop-shadow">
              Acesse seu terminal de cidadão soberano e acompanhe os dados governamentais com transparência em tempo real.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

