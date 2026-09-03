-- =============================================================
-- Brasil Soberano RP - Schema Supabase
-- Rode este script inteiro no SQL Editor do seu projeto Supabase.
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- Tabela de cidadãos
-- -------------------------------------------------------------
create table if not exists public.citizens (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  cpf         text not null unique,
  role        text not null default 'Cidadão',
  state       text not null default 'DF',
  party       text default 'Sem Partido',
  email       text unique,
  password    text,
  avatar_url  text,
  title_number text,
  bio         text,
  phone       text,
  city        text,
  created_at  timestamptz not null default now()
);

-- Bloqueia acesso direto via API REST (anon/authenticated).
-- O acesso acontece apenas pelas funções abaixo (security definer).
alter table public.citizens enable row level security;

-- Colunas do perfil completo (aditivas: não quebram registros existentes)
alter table public.citizens add column if not exists bio text;
alter table public.citizens add column if not exists phone text;
alter table public.citizens add column if not exists city text;

-- -------------------------------------------------------------
-- Carteira: saldo em centavos (NUNCA usar float/double p/ dinheiro)
-- -------------------------------------------------------------
alter table public.citizens add column if not exists balance_cents bigint not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'citizens_balance_cents_check'
  ) then
    alter table public.citizens
      add constraint citizens_balance_cents_check check (balance_cents >= 0);
  end if;
end
$$;

-- -------------------------------------------------------------
-- Transações financeiras (ledger) — histórico nunca é apagado
-- from_citizen_id null = crédito vindo do sistema (ex.: depósito inicial)
--
-- ATENÇÃO: a tabela pode já existir de um run antigo/parcial SEM as
-- colunas novas. Como "create table if not exists" pularia a criação,
-- usamos a regra: se ela existir SEM from_citizen_id, recria do zero.
-- -------------------------------------------------------------
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  from_citizen_id uuid references public.citizens(id),
  to_citizen_id   uuid references public.citizens(id),
  amount_cents    bigint not null check (amount_cents > 0),
  category        text not null default 'pix',
  description     text not null default '',
  created_at      timestamptz not null default now(),
  check (from_citizen_id is not null or to_citizen_id is not null)
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'transactions'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'from_citizen_id'
  ) then
    drop table public.transactions;
  end if;
end
$$;

create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  from_citizen_id uuid references public.citizens(id),
  to_citizen_id   uuid references public.citizens(id),
  amount_cents    bigint not null check (amount_cents > 0),
  category        text not null default 'pix',
  description     text not null default '',
  created_at      timestamptz not null default now(),
  check (from_citizen_id is not null or to_citizen_id is not null)
);

create index if not exists transactions_from_idx
  on public.transactions (from_citizen_id, created_at desc);
create index if not exists transactions_to_idx
  on public.transactions (to_citizen_id, created_at desc);

alter table public.transactions enable row level security;

-- -------------------------------------------------------------
-- Helper de serialização (devolve o cidadão em camelCase p/ o app)
-- -------------------------------------------------------------
create or replace function public.citizen_to_json(p_citizen public.citizens)
returns jsonb
language plpgsql
stable
as $$
declare v_json jsonb;
begin
  select to_jsonb(x) into v_json
  from (
    select
      p_citizen.id,
      p_citizen.name,
      p_citizen.email,
      p_citizen.cpf,
      p_citizen.role,
      p_citizen.state,
      p_citizen.party,
      p_citizen.avatar_url as "avatarUrl",
      p_citizen.title_number as "titleNumber",
      p_citizen.bio,
      p_citizen.phone,
      p_citizen.city,
      p_citizen.balance_cents as "balanceCents",
      extract(epoch from p_citizen.created_at) * 1000 as "createdAt"
  ) x;
  return v_json;
end
$$;

-- -------------------------------------------------------------
-- Cadastro de cidadão (criptografa a senha com bcrypt/pgcrypto)
-- Retorna: { ok: true, citizen: {...} } ou { ok: false, error: '...' }
-- -------------------------------------------------------------
create or replace function public.register_citizen(
  p_name text,
  p_email text,
  p_cpf text,
  p_state text,
  p_party text,
  p_password text,
  p_avatar_url text,
  p_title_number text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.citizens;
  v_start_balance bigint := 500000; -- R$ 5.000,00 de boas-vindas (em centavos)
  v_clean_cpf text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
begin
  if length(coalesce(p_name, '')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'nome_obrigatorio');
  end if;
  if length(coalesce(p_password, '')) < 4 then
    return jsonb_build_object('ok', false, 'error', 'senha_curta');
  end if;

  if exists (select 1 from public.citizens where lower(email) = lower(trim(coalesce(p_email, '')))) then
    return jsonb_build_object('ok', false, 'error', 'email_ja_cadastrado');
  end if;
  if exists (select 1 from public.citizens where regexp_replace(cpf, '\D', '', 'g') = v_clean_cpf) then
    return jsonb_build_object('ok', false, 'error', 'cpf_ja_cadastrado');
  end if;

  insert into public.citizens (name, email, cpf, state, party, password, avatar_url, title_number, balance_cents)
  values (
    trim(p_name),
    lower(trim(p_email)),
    p_cpf,
    coalesce(p_state, 'DF'),
    coalesce(p_party, 'Sem Partido'),
    crypt(p_password, gen_salt('bf', 10)),
    p_avatar_url,
    p_title_number,
    v_start_balance
  )
  returning * into v_row;

  -- Registra a origem do saldo no extrato (entrada vinda do "Banco Soberano").
  insert into public.transactions (from_citizen_id, to_citizen_id, amount_cents, category, description)
  values (null, v_row.id, v_start_balance, 'deposito', 'Bônus de boas-vindas do Brasil Soberano');

  return jsonb_build_object('ok', true, 'citizen', public.citizen_to_json(v_row));
end
$$;

-- -------------------------------------------------------------
-- Login por e-mail OU CPF
-- Retorna: { ok: true, citizen: {...} } ou { ok: false, error: 'credenciais_invalidas' }
-- -------------------------------------------------------------
create or replace function public.login_citizen(p_identifier text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.citizens;
  v_clean_cpf text := regexp_replace(coalesce(p_identifier, ''), '\D', '', 'g');
begin
  select * into v_row
  from public.citizens
  where lower(email) = lower(trim(coalesce(p_identifier, '')))
     or (length(v_clean_cpf) > 0 and regexp_replace(cpf, '\D', '', 'g') = v_clean_cpf)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'credenciais_invalidas');
  end if;

  if v_row.password is null or v_row.password = ''
     or v_row.password <> crypt(coalesce(p_password, ''), v_row.password) then
    return jsonb_build_object('ok', false, 'error', 'credenciais_invalidas');
  end if;

  return jsonb_build_object('ok', true, 'citizen', public.citizen_to_json(v_row));
end
$$;

-- -------------------------------------------------------------
-- Busca cidadão pelo id (usado p/ revalidar a sessão)
-- -------------------------------------------------------------
create or replace function public.get_citizen(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.citizens;
begin
  select * into v_row from public.citizens where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'nao_encontrado');
  end if;
  return jsonb_build_object('ok', true, 'citizen', public.citizen_to_json(v_row));
end
$$;

-- Permissões de execução para o cliente (anon key)
grant execute on function public.register_citizen(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.login_citizen(text, text) to anon, authenticated;
grant execute on function public.get_citizen(uuid) to anon, authenticated;

-- -------------------------------------------------------------
-- Atualização do perfil do cidadão (dados editáveis de identidade).
-- Email, CPF, saldo e credenciais NÃO são alterados aqui.
-- Retorna: { ok: true, citizen: {...} } ou { ok: false, error: '...' }
-- -------------------------------------------------------------
create or replace function public.update_citizen_profile(
  p_id uuid,
  p_name text,
  p_avatar_url text,
  p_state text,
  p_city text,
  p_bio text,
  p_phone text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.citizens;
begin
  if length(coalesce(p_name, '')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'nome_obrigatorio');
  end if;

  update public.citizens
  set name        = trim(p_name),
      avatar_url  = nullif(trim(coalesce(p_avatar_url, '')), ''),
      state       = upper(coalesce(nullif(trim(p_state), ''), 'DF')),
      city        = nullif(trim(coalesce(p_city, '')), ''),
      bio         = left(nullif(trim(coalesce(p_bio, '')), ''), 280),
      phone       = nullif(trim(coalesce(p_phone, '')), '')
  where id = p_id
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'nao_encontrado');
  end if;

  return jsonb_build_object('ok', true, 'citizen', public.citizen_to_json(v_row));
end
$$;

-- -------------------------------------------------------------
-- Troca de senha (exige a senha atual para confirmar a identidade)
-- Retorna: { ok: true } ou { ok: false, error: 'senha_incorreta'/'senha_curta' }
-- -------------------------------------------------------------
create or replace function public.change_password(
  p_id uuid,
  p_current_password text,
  p_new_password text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_password text;
begin
  select password into v_password from public.citizens where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'nao_encontrado');
  end if;

  if v_password is null or v_password = ''
     or v_password <> crypt(coalesce(p_current_password, ''), v_password) then
    return jsonb_build_object('ok', false, 'error', 'senha_incorreta');
  end if;

  if length(coalesce(p_new_password, '')) < 4 then
    return jsonb_build_object('ok', false, 'error', 'senha_curta');
  end if;

  update public.citizens set password = crypt(p_new_password, gen_salt('bf', 10))
  where id = p_id;

  return jsonb_build_object('ok', true);
end
$$;

grant execute on function public.update_citizen_profile(uuid, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.change_password(uuid, text, text) to anon, authenticated;

-- -------------------------------------------------------------
-- Cidadão demo (login rápido "Gov.br"): cidadao@brasilsoberano.gov.br / cidadao123
-- -------------------------------------------------------------
insert into public.citizens (name, email, cpf, role, state, party, password, avatar_url, title_number)
values (
  'Cidadão Soberano',
  'cidadao@brasilsoberano.gov.br',
  '000.000.000-00',
  'Cidadão',
  'DF',
  'Sem Partido',
  crypt('cidadao123', gen_salt('bf', 10)),
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  '0987654321'
)
on conflict (email) do nothing;

-- -------------------------------------------------------------
-- CARTEIRA / PIX
-- -------------------------------------------------------------

-- Saldo + extrato do cidadão (últimas 200 movimentações, mais novas primeiro)
create or replace function public.wallet_get(p_citizen_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_balance bigint;
  v_tx jsonb;
begin
  select balance_cents into v_balance from public.citizens where id = p_citizen_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'conta_nao_encontrada');
  end if;

  select coalesce(jsonb_agg(x.tx order by x.created_at desc), '[]'::jsonb) into v_tx
  from (
    select
      jsonb_build_object(
        'id', t.id::text,
        'direction', case when t.to_citizen_id = p_citizen_id then 'in' else 'out' end,
        'amountCents', t.amount_cents,
        'category', t.category,
        'description', t.description,
        'counterpartyName', case
          when t.from_citizen_id is null then 'Banco Soberano'
          else (select c.name from public.citizens c
                where c.id = case when t.from_citizen_id = p_citizen_id
                                  then t.to_citizen_id else t.from_citizen_id end)
        end,
        'createdAt', extract(epoch from t.created_at) * 1000
      ) as tx,
      t.created_at as created_at
    from public.transactions t
    where t.from_citizen_id = p_citizen_id or t.to_citizen_id = p_citizen_id
    order by t.created_at desc
    limit 200
  ) x;

  return jsonb_build_object(
    'ok', true,
    'balanceCents', coalesce(v_balance, 0),
    'transactions', v_tx
  );
end
$$;

-- Confirma o destinatário de uma chave PIX (CPF ou e-mail) antes do envio.
-- Retorna nome/UF/tipo de chave para o cliente exibir confirmação anti-erro.
create or replace function public.wallet_find_recipient(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_receiver public.citizens;
  v_clean text := regexp_replace(coalesce(p_key, ''), '\D', '', 'g');
  v_key_type text;
begin
  if length(coalesce(p_key, '')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'chave_invalida');
  end if;

  if length(v_clean) = 11 then
    select * into v_receiver
    from public.citizens
    where regexp_replace(cpf, '\D', '', 'g') = v_clean
    limit 1;
    v_key_type := 'cpf';
  elsif coalesce(p_key, '') ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    select * into v_receiver
    from public.citizens
    where lower(email) = lower(trim(p_key))
    limit 1;
    v_key_type := 'email';
  else
    return jsonb_build_object('ok', false, 'error', 'chave_invalida');
  end if;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'destinatario_nao_encontrado');
  end if;

  return jsonb_build_object('ok', true, 'recipient', jsonb_build_object(
    'name', v_receiver.name,
    'state', v_receiver.state,
    'keyType', v_key_type
  ));
end
$$;

-- Envia um PIX de um cidadão para outro (chave = CPF ou e-mail).
-- Atomicidade: trava a linha do pagador e valida saldo dentro da mesma função.
create or replace function public.pix_send(
  p_sender_id uuid,
  p_key text,
  p_amount_cents bigint,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sender public.citizens;
  v_receiver public.citizens;
  v_clean text := regexp_replace(coalesce(p_key, ''), '\D', '', 'g');
  v_desc text := left(coalesce(nullif(trim(coalesce(p_description, '')), ''), 'Transferência via PIX'), 140);
begin
  if p_amount_cents is null or p_amount_cents <= 0 then
    return jsonb_build_object('ok', false, 'error', 'valor_invalido');
  end if;

  select * into v_sender from public.citizens where id = p_sender_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'conta_nao_encontrada');
  end if;

  if length(v_clean) = 11 then
    select * into v_receiver
    from public.citizens
    where regexp_replace(cpf, '\D', '', 'g') = v_clean
    limit 1;
  elsif coalesce(p_key, '') ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    select * into v_receiver
    from public.citizens
    where lower(email) = lower(trim(p_key))
    limit 1;
  else
    return jsonb_build_object('ok', false, 'error', 'chave_invalida');
  end if;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'destinatario_nao_encontrado');
  end if;
  if v_receiver.id = v_sender.id then
    return jsonb_build_object('ok', false, 'error', 'auto_transferencia');
  end if;
  if coalesce(v_sender.balance_cents, 0) < p_amount_cents then
    return jsonb_build_object('ok', false, 'error', 'saldo_insuficiente');
  end if;

  update public.citizens set balance_cents = balance_cents - p_amount_cents where id = v_sender.id;
  update public.citizens set balance_cents = balance_cents + p_amount_cents where id = v_receiver.id;
  insert into public.transactions (from_citizen_id, to_citizen_id, amount_cents, category, description)
  values (v_sender.id, v_receiver.id, p_amount_cents, 'pix', v_desc);

  return jsonb_build_object('ok', true, 'newBalanceCents', v_sender.balance_cents - p_amount_cents);
end
$$;

grant execute on function public.wallet_get(uuid) to anon, authenticated;
grant execute on function public.wallet_find_recipient(text) to anon, authenticated;
grant execute on function public.pix_send(uuid, text, bigint, text) to anon, authenticated;

-- -------------------------------------------------------------
-- Backfill: cidadãos criados antes da Carteira ganham o depósito
-- inicial (R$ 5.000,00) e o registro no extrato, apenas uma vez.
-- -------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select c.id
    from public.citizens c
    where not exists (
      select 1 from public.transactions t
      where t.to_citizen_id = c.id and t.category = 'deposito'
    )
      and c.balance_cents < 500000
    limit 500
  loop
    update public.citizens set balance_cents = 500000 where id = r.id;
    insert into public.transactions (from_citizen_id, to_citizen_id, amount_cents, category, description)
    values (null, r.id, 500000, 'deposito', 'Bônus de boas-vindas do Brasil Soberano');
  end loop;
end
$$;
