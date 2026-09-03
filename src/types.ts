export interface Citizen {
  id: string;
  name: string;
  cpf: string;
  role: string;
  state: string;
  party?: string;
  email?: string;
  password?: string;
  avatarUrl: string;
  titleNumber?: string;
  bio?: string;
  phone?: string;
  city?: string;
  balanceCents?: number;
  createdAt?: number;
}

export type TransactionDirection = 'in' | 'out';
export type PixKeyType = 'cpf' | 'email';

export interface WalletTransaction {
  id: string;
  direction: TransactionDirection;
  amountCents: number;
  category: string;
  description: string;
  counterpartyName: string;
  createdAt: number;
}

export interface WalletData {
  balanceCents: number;
  transactions: WalletTransaction[];
}

export interface PixRecipient {
  name: string;
  state: string;
  keyType: PixKeyType;
}

export interface BrazilianStateRP {
  uf: string;
  name: string;
  region: string;
  capital: string;
  flagUrl?: string;
  population?: string;
  governor?: string;
}
