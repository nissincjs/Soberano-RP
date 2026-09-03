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
  createdAt?: number;
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
