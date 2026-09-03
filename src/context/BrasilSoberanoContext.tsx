import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Citizen, BrazilianStateRP } from '../types';
import { INITIAL_CITIZEN, INITIAL_STATES } from '../data/mockInitialData';
import {
  registerCitizen as apiRegister,
  loginCitizen as apiLogin,
  fetchCitizen as apiFetchCitizen,
} from '../lib/citizenApi';
import type { CitizenEnvelope } from '../lib/citizenApi';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface RegisterCitizenPayload {
  name: string;
  email: string;
  cpf: string;
  state: string;
  party?: string;
  password?: string;
}

interface BrasilSoberanoContextType {
  citizen: Citizen;
  updateCitizen: (updates: Partial<Citizen>) => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (identifier?: string, password?: string) => Promise<boolean>;
  registerCitizen: (data: RegisterCitizenPayload) => Promise<boolean>;
  logout: () => void;
  states: BrazilianStateRP[];
  toastMessage: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BrasilSoberanoContext = createContext<BrasilSoberanoContextType | undefined>(undefined);

const CITIZEN_STORAGE_KEY = 'brasil_soberano_active_user';
const AUTH_STORAGE_KEY = 'brasil_soberano_auth';

// Conta demo semeadas pelo schema.sql (login rápido "Gov.br").
const DEMO_EMAIL = 'cidadao@brasilsoberano.gov.br';
const DEMO_PASSWORD = 'cidadao123';

function readStoredCitizen(): Citizen {
  try {
    const saved = localStorage.getItem(CITIZEN_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading stored citizen:', e);
  }
  return INITIAL_CITIZEN;
}

function readStoredAuth(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistSession(citizen: Citizen) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(citizen));
  } catch (e) {
    console.error('Error persisting session:', e);
  }
}

function clearSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(CITIZEN_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing session:', e);
  }
}

function friendlyError(error?: string): string {
  switch (error) {
    case 'email_ja_cadastrado':
      return 'Já existe uma conta cadastrada com este e-mail.';
    case 'cpf_ja_cadastrado':
      return 'Já existe um cidadão cadastrado com este CPF.';
    case 'credenciais_invalidas':
      return 'E-mail/CPF ou senha inválidos.';
    case 'nome_obrigatorio':
      return 'Informe seu nome completo.';
    case 'senha_curta':
      return 'A senha deve ter ao menos 4 caracteres.';
    case 'nao_encontrado':
      return 'Cidadão não encontrado.';
    default:
      return 'Não foi possível acessar o banco de dados. Verifique a configuração do Supabase.';
  }
}

function applyLoginResult(envelope: CitizenEnvelope): Citizen | null {
  if (envelope.ok && envelope.citizen) return envelope.citizen;
  return null;
}

export const BrasilSoberanoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [citizen, setCitizen] = useState<Citizen>(readStoredCitizen);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(readStoredAuth);
  const [authLoading, setAuthLoading] = useState<boolean>(readStoredAuth);
  const [toastMessage, setToastMessage] = useState<ToastInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string>('wallet');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const updateCitizen = (updates: Partial<Citizen>) => {
    setCitizen(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving citizen:', e);
      }
      return updated;
    });
  };

  // Revalida a sessão salva no navegador contra o Supabase ao carregar a página.
  useEffect(() => {
    let cancelled = false;

    const rehydrate = async () => {
      if (!readStoredAuth()) {
        if (!cancelled) setAuthLoading(false);
        return;
      }

      const storedId = readStoredCitizen().id;
      if (!storedId) {
        if (!cancelled) setAuthLoading(false);
        return;
      }

      const result = await apiFetchCitizen(storedId);
      if (cancelled) return;

      if (result.ok && result.citizen) {
        setCitizen(result.citizen);
        try {
          localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(result.citizen));
        } catch (e) {
          console.error('Error saving citizen:', e);
        }
      } else if (result.error === 'nao_encontrado') {
        clearSession();
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    };

    rehydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (identifier?: string, password?: string): Promise<boolean> => {
    setAuthLoading(true);

    let result: CitizenEnvelope;

    // Login rápido "Gov.br": entra na conta demo criada pelo schema.sql.
    if (!identifier) {
      result = await apiLogin(DEMO_EMAIL, DEMO_PASSWORD);
    } else {
      result = await apiLogin(identifier.trim(), password ?? '');
    }

    const loggedCitizen = applyLoginResult(result);
    if (!loggedCitizen) {
      setAuthLoading(false);
      showToast(friendlyError(result.error), 'error');
      return false;
    }

    setCitizen(loggedCitizen);
    setIsAuthenticated(true);
    persistSession(loggedCitizen);
    setAuthLoading(false);
    showToast(`Bem-vindo(a) ao terminal, ${loggedCitizen.name}!`, 'success');
    return true;
  };

  const registerCitizen = async (data: RegisterCitizenPayload): Promise<boolean> => {
    setAuthLoading(true);

    const result = await apiRegister({
      name: data.name.trim(),
      email: data.email.trim(),
      cpf: data.cpf.trim(),
      state: data.state || 'DF',
      party: data.party || 'Sem Partido',
      password: data.password,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=300&q=80`,
      titleNumber: String(Math.floor(1000000000 + Math.random() * 9000000000)),
    });

    const newCitizen = applyLoginResult(result);
    if (!newCitizen) {
      setAuthLoading(false);
      showToast(friendlyError(result.error), 'error');
      return false;
    }

    setCitizen(newCitizen);
    setIsAuthenticated(true);
    persistSession(newCitizen);
    setAuthLoading(false);
    showToast(`Cadastro realizado com sucesso! Bem-vindo(a), ${newCitizen.name}.`, 'success');
    return true;
  };

  const logout = () => {
    clearSession();
    setIsAuthenticated(false);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  return (
    <BrasilSoberanoContext.Provider
      value={{
        citizen,
        updateCitizen,
        isAuthenticated,
        authLoading,
        login,
        registerCitizen,
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
