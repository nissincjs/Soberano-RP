import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Citizen, BrazilianStateRP } from '../types';
import { INITIAL_CITIZEN, INITIAL_STATES } from '../data/mockInitialData';

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
const USERS_DB_STORAGE_KEY = 'brasil_soberano_registered_users';

export const BrasilSoberanoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [citizen, setCitizen] = useState<Citizen>(() => {
    try {
      const saved = localStorage.getItem(CITIZEN_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading stored citizen:', e);
    }
    return INITIAL_CITIZEN;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('brasil_soberano_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<ToastInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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

  const login = async (identifier?: string, password?: string): Promise<boolean> => {
    setAuthLoading(true);
    await new Promise(r => setTimeout(r, 400));

    // Fast-track demo login if no credentials passed (e.g. Gov.br click)
    if (!identifier) {
      const user = citizen.name ? citizen : INITIAL_CITIZEN;
      setCitizen(user);
      setIsAuthenticated(true);
      localStorage.setItem('brasil_soberano_auth', 'true');
      localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(user));
      setAuthLoading(false);
      showToast(`Bem-vindo(a) ao terminal, ${user.name}!`, 'success');
      return true;
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanCpf = cleanId.replace(/\D/g, '');

    try {
      const rawUsers = localStorage.getItem(USERS_DB_STORAGE_KEY);
      const registeredUsers: Citizen[] = rawUsers ? JSON.parse(rawUsers) : [];

      // Find user by email or CPF
      const foundUser = registeredUsers.find(u => {
        const uEmail = (u.email || '').toLowerCase();
        const uCpf = (u.cpf || '').replace(/\D/g, '');
        return uEmail === cleanId || (cleanCpf && uCpf === cleanCpf);
      });

      if (foundUser) {
        if (password && foundUser.password && foundUser.password !== password) {
          setAuthLoading(false);
          showToast('Senha incorreta para o usuário informado.', 'error');
          return false;
        }
        setCitizen(foundUser);
        setIsAuthenticated(true);
        localStorage.setItem('brasil_soberano_auth', 'true');
        localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(foundUser));
        setAuthLoading(false);
        showToast(`Sessão iniciada com sucesso! Bem-vindo(a), ${foundUser.name}.`, 'success');
        return true;
      }

      // If matching the default demo citizen
      const demoCpf = INITIAL_CITIZEN.cpf.replace(/\D/g, '');
      const demoEmail = (INITIAL_CITIZEN.email || '').toLowerCase();
      if (cleanId === demoEmail || (cleanCpf && cleanCpf === demoCpf)) {
        setCitizen(INITIAL_CITIZEN);
        setIsAuthenticated(true);
        localStorage.setItem('brasil_soberano_auth', 'true');
        localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(INITIAL_CITIZEN));
        setAuthLoading(false);
        showToast(`Acesso concedido. Bem-vindo(a), ${INITIAL_CITIZEN.name}.`, 'success');
        return true;
      }

      // Default fallback: create session for this identifier
      const autoUser: Citizen = {
        id: `cit-${Date.now()}`,
        name: identifier.split('@')[0] || 'Cidadão',
        cpf: identifier.includes('@') ? '000.000.000-00' : identifier,
        role: 'Cidadão',
        state: 'DF',
        email: identifier.includes('@') ? identifier : undefined,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        createdAt: Date.now()
      };

      setCitizen(autoUser);
      setIsAuthenticated(true);
      localStorage.setItem('brasil_soberano_auth', 'true');
      localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(autoUser));
      setAuthLoading(false);
      showToast(`Bem-vindo(a), ${autoUser.name}!`, 'success');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setAuthLoading(false);
      showToast('Falha ao processar login.', 'error');
      return false;
    }
  };

  const registerCitizen = async (data: RegisterCitizenPayload): Promise<boolean> => {
    setAuthLoading(true);
    await new Promise(r => setTimeout(r, 400));

    try {
      const newCitizen: Citizen = {
        id: `cit-${Date.now()}`,
        name: data.name.trim(),
        email: data.email.trim(),
        cpf: data.cpf.trim(),
        state: data.state || 'DF',
        role: 'Cidadão',
        party: data.party || 'Sem Partido',
        password: data.password,
        avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=300&q=80`,
        titleNumber: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        createdAt: Date.now()
      };

      const rawUsers = localStorage.getItem(USERS_DB_STORAGE_KEY);
      const registeredUsers: Citizen[] = rawUsers ? JSON.parse(rawUsers) : [];
      registeredUsers.push(newCitizen);
      localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(registeredUsers));

      setCitizen(newCitizen);
      setIsAuthenticated(true);
      localStorage.setItem('brasil_soberano_auth', 'true');
      localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(newCitizen));

      setAuthLoading(false);
      showToast(`Cadastro realizado com sucesso! Bem-vindo(a), ${newCitizen.name}.`, 'success');
      return true;
    } catch (err) {
      console.error('Register error:', err);
      setAuthLoading(false);
      showToast('Erro ao realizar cadastro.', 'error');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('brasil_soberano_auth');
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
