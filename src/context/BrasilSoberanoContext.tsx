import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { Citizen, BrazilianStateRP } from '../types';
import { INITIAL_STATES } from '../data/mockInitialData';
import { supabase } from '../lib/supabase';
import {
  signUpWithPassword,
  signInWithPassword as apiSignIn,
  signInWithGoogle,
  resendConfirmationEmail,
  sendPasswordReset,
  completePasswordReset,
  signOut as apiSignOut,
  getAuthUserInfo,
  finalizeCitizen,
  getMyCitizen,
} from '../lib/citizenApi';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface RegisterCitizenPayload {
  name: string;
  email: string;
  cpf: string;
  state: string;
  password: string;
}

type AuthProvider = 'email' | 'google';

interface BrasilSoberanoContextType {
  citizen: Citizen | null;
  updateCitizen: (updates: Partial<Citizen>) => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  authProvider: AuthProvider | null;
  authEmail: string | null;
  pendingPasswordReset: boolean;
  login: (email: string, password: string) => Promise<'ok' | 'email_nao_confirmado' | 'error'>;
  loginWithGoogle: () => Promise<boolean>;
  registerCitizen: (data: RegisterCitizenPayload) => Promise<'ok' | 'email_nao_confirmado' | 'error'>;
  resendConfirmation: (email: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  submitPasswordReset: (newPassword: string) => Promise<boolean>;
  cancelPasswordReset: () => void;
  logout: () => Promise<void>;
  states: BrazilianStateRP[];
  toastMessage: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BrasilSoberanoContext = createContext<BrasilSoberanoContextType | undefined>(undefined);

function friendlyError(error?: string): string {
  switch (error) {
    case 'email_nao_confirmado':
      return 'Confirme seu e-mail antes de entrar. Enviamos um link de ativação.';
    case 'email_ja_cadastrado':
      return 'Já existe uma conta cadastrada com este e-mail.';
    case 'cpf_ja_cadastrado':
      return 'Já existe um cidadão cadastrado com este CPF.';
    case 'cpf_invalido':
      return 'CPF inválido. Confira os dígitos.';
    case 'credenciais_invalidas':
    case 'senha_incorreta':
      return 'E-mail ou senha inválidos.';
    case 'senha_curta':
      return 'A senha deve ter ao menos 6 caracteres.';
    case 'senha_igual':
      return 'A nova senha deve ser diferente da atual.';
    case 'muitas_tentativas':
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
    case 'erro_envio_email':
      return 'Não foi possível enviar o e-mail. Tente novamente mais tarde.';
    case 'nao_encontrado':
    case 'nao_autenticado':
      return 'Sessão não encontrada. Faça login novamente.';
    case 'conta_ja_existente':
      return 'Esta conta já foi cadastrada. Tente entrar normalmente.';
    default:
      return 'Não foi possível acessar o servidor. Verifique sua conexão e tente novamente.';
  }
}

export const BrasilSoberanoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authProvider, setAuthProvider] = useState<AuthProvider | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [pendingPasswordReset, setPendingPasswordReset] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<ToastInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string>('wallet');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const updateCitizen = (updates: Partial<Citizen>) => {
    setCitizen(prev => (prev ? { ...prev, ...updates } : prev));
  };

  const hydrateRef = useRef<Promise<boolean> | null>(null);

  const runHydrate = async (): Promise<boolean> => {
    const info = await getAuthUserInfo();
    if (!info) {
      setCitizen(null);
      setIsAuthenticated(false);
      setAuthProvider(null);
      setAuthEmail(null);
      return false;
    }
    setAuthProvider(info.provider);
    setAuthEmail(info.email);

    const finalize = await finalizeCitizen();
    if (finalize.ok && finalize.citizen) {
      setCitizen(finalize.citizen);
      setIsAuthenticated(true);
      return true;
    }

    const mine = await getMyCitizen();
    if (mine.ok && mine.citizen) {
      setCitizen(mine.citizen);
      setIsAuthenticated(true);
      return true;
    }

    setIsAuthenticated(false);
    return false;
  };

  // Deduplica hidratações concorrentes (ex.: SIGNED_IN + getSession no boot).
  const hydrateSession = (): Promise<boolean> => {
    if (!hydrateRef.current) {
      hydrateRef.current = runHydrate().finally(() => {
        hydrateRef.current = null;
      });
    }
    return hydrateRef.current;
  };

  // Boot: sessão existente no navegador (ou token recebido pelo link de
  // confirmação de e-mail / reset de senha na própria URL).
  useEffect(() => {
    let cancelled = false;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        setCitizen(null);
        setIsAuthenticated(false);
        setAuthProvider(null);
        setAuthEmail(null);
        setPendingPasswordReset(false);
        setAuthLoading(false);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setPendingPasswordReset(true);
        setIsAuthenticated(true);
        setAuthLoading(false);
        return;
      }

      // Login novo (formulário), confirmação de e-mail ou retorno do Google:
      // o token vem na URL e o Supabase emite SIGNED_IN.
      if (event === 'SIGNED_IN' && session) {
        setAuthLoading(true);
        hydrateSession().finally(() => {
          if (!cancelled) setAuthLoading(false);
        });
        return;
      }

      // Sessão existente encontrada (sem token novo na URL): a revalidação
      // fica por conta do getSession() abaixo para evitar hidratação dupla.
      if (event === 'INITIAL_SESSION' && !session) {
        if (!cancelled) setAuthLoading(false);
      }
    });

    // Sessão já armazenada no navegador (reload): revalida o cidadão.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setAuthLoading(true);
        hydrateSession().finally(() => {
          if (!cancelled) setAuthLoading(false);
        });
      } else {
        setAuthLoading(false);
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<'ok' | 'email_nao_confirmado' | 'error'> => {
    const result = await apiSignIn(email, password);
    if (!result.ok) {
      if (result.error === 'email_nao_confirmado') {
        showToast('E-mail ainda não confirmado. Enviamos um novo link de ativação.', 'info');
        return 'email_nao_confirmado';
      }
      showToast(friendlyError(result.error), 'error');
      return 'error';
    }
    // Aguarda a re-hidratação (evento SIGNED_IN cria/carrega o cidadão).
    setAuthLoading(true);
    return 'ok';
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    const result = await signInWithGoogle();
    if (!result.ok) {
      showToast(friendlyError(result.error), 'error');
      return false;
    }
    return true;
  };

  const registerCitizen = async (
    data: RegisterCitizenPayload
  ): Promise<'ok' | 'email_nao_confirmado' | 'error'> => {
    const result = await signUpWithPassword(data);
    if (!result.ok) {
      showToast(friendlyError(result.error), 'error');
      return 'error';
    }

    // Com "Confirm email" ativo o Supabase não abre sessão: o fluxo segue
    // pela tela de confirmação até o jogador clicar no link recebido.
    const user = await getAuthUserInfo();
    if (!user) {
      return 'email_nao_confirmado';
    }

    setAuthLoading(true);
    await hydrateSession();
    setAuthLoading(false);
    showToast('Cadastro realizado com sucesso!', 'success');
    return 'ok';
  };

  const resendConfirmation = async (email: string): Promise<boolean> => {
    const result = await resendConfirmationEmail(email);
    if (!result.ok) {
      showToast(friendlyError(result.error), 'error');
      return false;
    }
    showToast('Novo link de confirmação enviado!', 'success');
    return true;
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    const result = await sendPasswordReset(email);
    if (!result.ok) {
      showToast(friendlyError(result.error), 'error');
      return false;
    }
    showToast('Enviamos um link de redefinição de senha para o seu e-mail.', 'success');
    return true;
  };

  const submitPasswordReset = async (newPassword: string): Promise<boolean> => {
    const result = await completePasswordReset(newPassword);
    if (!result.ok) {
      showToast(friendlyError(result.error), 'error');
      return false;
    }
    setPendingPasswordReset(false);
    setAuthLoading(true);
    await hydrateSession();
    setAuthLoading(false);
    showToast('Senha redefinida com sucesso!', 'success');
    return true;
  };

  const cancelPasswordReset = () => {
    setPendingPasswordReset(false);
    setAuthLoading(false);
  };

  const logout = async () => {
    await apiSignOut();
    setCitizen(null);
    setIsAuthenticated(false);
    setAuthProvider(null);
    setAuthEmail(null);
    setPendingPasswordReset(false);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  return (
    <BrasilSoberanoContext.Provider
      value={{
        citizen,
        updateCitizen,
        isAuthenticated,
        authLoading,
        authProvider,
        authEmail,
        pendingPasswordReset,
        login,
        loginWithGoogle,
        registerCitizen,
        resendConfirmation,
        requestPasswordReset,
        submitPasswordReset,
        cancelPasswordReset,
        logout,
        states: INITIAL_STATES,
        toastMessage,
        showToast,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </BrasilSoberanoContext.Provider>
  );
};

export const useBrasilSoberano = () => {
  const context = useContext(BrasilSoberanoContext);
  if (!context) {
    throw new Error('useBrasilSoberano must be used within a BrasilSoberanoProvider');
  }
  return context;
};
