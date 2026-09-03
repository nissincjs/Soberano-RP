import { supabase } from './supabase';
import type { Citizen, WalletTransaction, PixRecipient } from '../types';

export interface CitizenEnvelope {
  ok: boolean;
  citizen?: Citizen;
  error?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  state: string;
  party?: string;
  password?: string;
  avatarUrl: string;
  titleNumber: string;
}

async function callRpc(fn: string, params: Record<string, unknown>): Promise<CitizenEnvelope> {
  try {
    const { data, error } = await supabase.rpc(fn, params);
    if (error) {
      console.error(`[Supabase] rpc ${fn} error:`, error);
      return { ok: false, error: error.message };
    }
    const envelope = (data ?? {}) as { ok?: boolean; citizen?: Citizen; error?: string };
    return { ok: !!envelope.ok, citizen: envelope.citizen, error: envelope.error };
  } catch (err) {
    console.error(`[Supabase] rpc ${fn} exception:`, err);
    return { ok: false, error: 'rede' };
  }
}

export function registerCitizen(data: RegisterPayload): Promise<CitizenEnvelope> {
  return callRpc('register_citizen', {
    p_name: data.name,
    p_email: data.email,
    p_cpf: data.cpf,
    p_state: data.state,
    p_party: data.party ?? 'Sem Partido',
    p_password: data.password ?? '',
    p_avatar_url: data.avatarUrl,
    p_title_number: data.titleNumber,
  });
}

export function loginCitizen(identifier: string, password: string): Promise<CitizenEnvelope> {
  return callRpc('login_citizen', { p_identifier: identifier, p_password: password });
}

export function fetchCitizen(id: string): Promise<CitizenEnvelope> {
  return callRpc('get_citizen', { p_id: id });
}

export interface WalletEnvelope {
  ok: boolean;
  error?: string;
  balanceCents?: number;
  transactions?: WalletTransaction[];
}

export interface RecipientEnvelope {
  ok: boolean;
  error?: string;
  recipient?: PixRecipient;
}

export interface PixSendEnvelope {
  ok: boolean;
  error?: string;
  newBalanceCents?: number;
}

async function callRaw(fn: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase.rpc(fn, params);
    if (error) {
      console.error(`[Supabase] rpc ${fn} error:`, error);
      return { ok: false, error: error.message };
    }
    return (data ?? {}) as Record<string, unknown>;
  } catch (err) {
    console.error(`[Supabase] rpc ${fn} exception:`, err);
    return { ok: false, error: 'rede' };
  }
}

export async function getWallet(citizenId: string): Promise<WalletEnvelope> {
  const raw = await callRaw('wallet_get', { p_citizen_id: citizenId });
  return {
    ok: !!raw.ok,
    error: raw.error as string | undefined,
    balanceCents: raw.balanceCents as number | undefined,
    transactions: (raw.transactions ?? []) as WalletTransaction[],
  };
}

export async function findPixRecipient(key: string): Promise<RecipientEnvelope> {
  const raw = await callRaw('wallet_find_recipient', { p_key: key });
  return {
    ok: !!raw.ok,
    error: raw.error as string | undefined,
    recipient: (raw.recipient as PixRecipient) ?? undefined,
  };
}

export async function sendPix(args: {
  senderId: string;
  key: string;
  amountCents: number;
  description?: string;
}): Promise<PixSendEnvelope> {
  const raw = await callRaw('pix_send', {
    p_sender_id: args.senderId,
    p_key: args.key,
    p_amount_cents: args.amountCents,
    p_description: args.description ?? null,
  });
  return {
    ok: !!raw.ok,
    error: raw.error as string | undefined,
    newBalanceCents: raw.newBalanceCents as number | undefined,
  };
}
