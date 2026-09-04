import { supabase } from './supabase';
import type { Citizen, WalletTransaction, PixRecipient } from '../types';

export interface CitizenEnvelope {
  ok: boolean;
  citizen?: Citizen;
  error?: string;
}

export interface SimpleEnvelope {
  ok: boolean;
  error?: string;
}

export interface CpfAvailability {
  available: boolean;
  error?: string;
}

export interface AuthUserInfo {
  id: string;
  email: string;
  provider: 'email' | 'google';
}

export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  state: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Supabase Auth (GoTrue) — login por e-mail com confirmação + Google OAuth.
// Erros são traduzidos para códigos snake_case curtos, como no restante do app.
// ---------------------------------------------------------------------------

function authError(message?: string): string {
  const msg = (message || '').toLowerCase();
  if (msg.includes('email not confirmed')) return 'email_nao_confirmado';
  if (msg.includes('invalid login credentials')) return 'credenciais_invalidas';
  if (msg.includes('already been registered') || msg.includes('already registered'))
    return 'email_ja_cadastrado';
  if (msg.includes('valid password') || msg.includes('at least 6 characters'))
    return 'senha_curta';
  if (msg.includes('password should be different')) return 'senha_igual';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'muitas_tentativas';
  if (msg.includes('network') || msg.includes('fetch')) return 'rede';
  return 'rede';
}

function authRedirect(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
}

export async function signUpWithPassword(data: RegisterPayload): Promise<SimpleEnvelope> {
  try {
    const { error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        emailRedirectTo: authRedirect(),
        data: {
          name: data.name.trim(),
          cpf: data.cpf.trim(),
          state: data.state || 'DF',
        },
      },
    });
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  } catch (err) {
    console.error('[Auth] signUp exception:', err);
    return { ok: false, error: 'rede' };
  }
}

export async function signInWithPassword(email: string, password: string): Promise<SimpleEnvelope> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  } catch (err) {
    console.error('[Auth] signIn exception:', err);
    return { ok: false, error: 'rede' };
  }
}

export async function signInWithGoogle(): Promise<SimpleEnvelope> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirect() },
    });
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  } catch (err) {
    console.error('[Auth] google exception:', err);
    return { ok: false, error: 'rede' };
  }
}

export async function resendConfirmationEmail(email: string): Promise<SimpleEnvelope> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: authRedirect() },
    });
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  } catch (err) {
    console.error('[Auth] resend exception:', err);
    return { ok: false, error: 'rede' };
  }
}

export async function sendPasswordReset(email: string): Promise<SimpleEnvelope> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: authRedirect(),
    });
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  } catch (err) {
    console.error('[Auth] reset exception:', err);
    return { ok: false, error: 'rede' };
  }
}

// Reauth com a senha atual (confirma a identidade) e então troca a senha.
export async function changeAuthPassword(args: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<SimpleEnvelope> {
  try {
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: args.email.trim().toLowerCase(),
      password: args.currentPassword,
    });
    if (reauthError) return { ok: false, error: 'senha_incorreta' };

    const { error } = await supabase.auth.updateUser({ password: args.newPassword });
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  } catch (err) {
    console.error('[Auth] change password exception:', err);
    return { ok: false, error: 'rede' };
  }
}

export async function completePasswordReset(newPassword: string): Promise<SimpleEnvelope> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  } catch (err) {
    console.error('[Auth] complete reset exception:', err);
    return { ok: false, error: 'rede' };
  }
}

export async function signOut(): Promise<SimpleEnvelope> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  } catch (err) {
    console.error('[Auth] signOut exception:', err);
    return { ok: false, error: 'rede' };
  }
}

export async function getAuthUserInfo(): Promise<AuthUserInfo | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const meta = (data.user.app_metadata ?? {}) as { provider?: string };
    return {
      id: data.user.id,
      email: data.user.email ?? '',
      provider: meta.provider === 'google' ? 'google' : 'email',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Erros vindos do retorno do OAuth (Google). O GoTrue devolve os motivos de
// falha como query params na redirect URL — ex.: e-mail já em uso por outro
// método de login, usuário cancelou a autorização, redirect não permitido.
// ---------------------------------------------------------------------------

export interface OAuthErrorInfo {
  code: string;
  description?: string;
}

export function readOAuthError(): OAuthErrorInfo | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('error') || params.get('error_code');
  if (!code) return null;
  return { code, description: params.get('error_description') ?? undefined };
}

// Remove apenas os params de erro da URL (mantém code/state intactos para o
// Supabase concluir um fluxo válido quando não houver erro).
export function clearOAuthErrorFromUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  ['error', 'error_code', 'error_description'].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState(null, '', url.toString());
}

// ---------------------------------------------------------------------------
// RPCs (envelope { ok, citizen?, error? }) — mesmas convenções do projeto.
// ---------------------------------------------------------------------------

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

// Garante que o cidadão do usuário autenticado exista (idempotente).
// Se o usuário veio do Google (sem CPF), o banco gera um CPF automático.
export function finalizeCitizen(): Promise<CitizenEnvelope> {
  return callRpc('finalize_citizen', {});
}

export function getMyCitizen(): Promise<CitizenEnvelope> {
  return callRpc('get_my_citizen', {});
}

export async function isCpfAvailable(cpf: string): Promise<CpfAvailability> {
  try {
    const { data, error } = await supabase.rpc('cpf_available', { p_cpf: cpf });
    if (error) {
      console.error('[Supabase] cpf_available error:', error);
      return { available: false, error: 'rede' };
    }
    const env = (data ?? {}) as { available?: boolean; error?: string };
    return { available: !!env.available, error: env.error };
  } catch (err) {
    console.error('[Supabase] cpf_available exception:', err);
    return { available: false, error: 'rede' };
  }
}

export interface UpdateProfilePayload {
  name: string;
  avatarUrl?: string;
  state?: string;
  city?: string;
  bio?: string;
  phone?: string;
}

export function updateCitizenProfile(id: string, data: UpdateProfilePayload): Promise<CitizenEnvelope> {
  return callRpc('update_citizen_profile', {
    p_id: id,
    p_name: data.name,
    p_avatar_url: data.avatarUrl ?? '',
    p_state: data.state ?? '',
    p_city: data.city ?? '',
    p_bio: data.bio ?? '',
    p_phone: data.phone ?? '',
  });
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
