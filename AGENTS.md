# Brasil Soberano RP

> Jogo de roleplay brasileiro, multijogador e web, apresentado como um **site/dashboard governamental dark**. Tema híbrido de **vida + política**: o jogador é um cidadão que vive, trabalha, movimenta dinheiro e pode subir na política (vereador → prefeito → governador → presidente). Este arquivo é a fonte de contexto do projeto — leia antes de mexer no código.

## Estado atual (o que já está pronto)

- **Base**: React 19 + Vite + TypeScript + Tailwind CSS v4 (Vite plugin) + lucide-react + express (servidor). `bun` e `npm` suportados.
- **Auth de cidadão (Supabase Auth)**: cadastro e login por **e-mail + senha com confirmação por e-mail** ou **"Continuar com Google"**. A sessão é do Supabase Auth (GoTrue, PKCE) — o `id` do cidadão **é o `auth.uid()`** (uma identidade única p/ jogo e sessão). O cidadão é criado pela RPC `security definer` `finalize_citizen()` após o e-mail confirmado/login Google (lê `user_metadata`; **CPF é gerado automaticamente para contas Google**, pois CPF é chave PIX). Suporte de reset de senha por e-mail (fluxo `PASSWORD_RECOVERY`). **A conta demo e o cadastro custom antigo (bcrypt/RPC) foram removidos** — sem dados mockados de cidadão. Pendências de configuração no painel Supabase: providers Google ativo, "Confirm email" ligado, Site URL/redirects `https://brasilsoberano.site`.
- **Layout**: Sidebar + TopNavbar + tema dark (`#090a0f` / cards `#0c0e14` / bordas `#1e222d`, acentos `emerald`). Abas controladas por `activeTab` no `BrasilSoberanoContext`.
- **Painel do Cidadão (Dashboard pós-login)**: home que busca `wallet_get` e mostra saudação por horário + data/localização, card-hero de saldo com ações rápidas, resumo do cidadão (partido, residência, cidadão desde) e últimas movimentações. Visual pós-login refinado em 2026-09: fundo com brilhos/gridline ambientes (`index.css`), Sidebar com indicador online e grupo "Em breve" travado (módulos futuros), TopNavbar com chip de saldo clicável, headers de página unificados via `PageHeader` (`src/components/ui/PageHeader.tsx`).
- **Cadastro base**: 27 UFs brasileiras em `src/data/mockInitialData.ts` (mock estático, ainda não é tabela). **`INITIAL_CITIZEN` (cidadão mockado) foi removido.**
- **Carteira/PIX** (primeiro módulo de jogo): cada cidadão tem `balance_cents` (saldo em **centavos**, R$ 5.000,00 de boas-vindas gravado como depósito inicial), envia PIX por CPF/e-mail, vê extrato. Ver `WalletPage` + RPCs `wallet_get`, `wallet_find_recipient`, `pix_send`.
- **Meu Perfil** (configurações do cidadão): edita nome, UF, cidade, telefone, bio e foto (URL ou avatares sugeridos; sem URL usa iniciais via componente `Avatar`). E-mail e CPF são read-only (identidade/chaves PIX). Troca de senha usa reauth com a senha atual via Supabase Auth (`changeAuthPassword`) — bloco oculto para contas só-Google. Ver `ProfilePage` + RPC `update_citizen_profile`. Acesso pela aba "Meu Perfil" na Sidebar ou clicando no usuário no TopNavbar.

## Stack / Infra

- Repo: `github.com/nissincjs/Soberano-RP` (a pasta local é `/home/ubuntu/Soberano-RP`).
- Banco: Supabase (Postgres). **O `schema.sql` é idempotente e é a única fonte de verdade do banco** — sempre edite o arquivo e rode ele inteiro no SQL Editor do Supabase (DDL não roda pela anon key e **não** é aplicado automaticamente).
- Deploy / produção: este mesmo host roda o site online em Docker (`Dockerfile` + `docker-compose.yml`, servindo o SPA + express). O site online é o container `soberano-rp-soberano-rp-1` (porta interna 3005, exposto só em `127.0.0.1`). URL pública: **https://brasilsoberano.site** (www incluso) — DNS na Cloudflare (A `@`/`www` -> `163.176.169.42`, proxied) e reverse proxy nginx no host (`/etc/nginx/conf.d/brasilsoberano.conf`) com cert Let's Encrypt. O domínio antigo `soberano.andreluiscs.online` foi desativado (vhost removido). Vars em `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `APP_URL`).

## Convenções e invariantes (NÃO quebrar)

1. **UI sempre em pt-BR** (textos, erros, datas, moeda). Nomes de variáveis/código em inglês.
2. **Dinheiro é sempre inteiro de centavos** (`bigint` no banco, `number`/string no cliente). Nunca `float`/`double` para valores monetários. Formatar com `src/lib/format.ts` (`formatBRL`).
3. **Padrão Supabase**: tabelas com RLS ativada; acesso só por funções `security definer` que devolvem envelope `{ ok, error?, ... }` com erros em snake_case curtos (ex.: `saldo_insuficiente`). Cliente não acessa tabelas direto.
4. **Módulos de UI**: cada módulo novo = um item novo na Sidebar + um case no renderizador de abas do `App.tsx` + página em `src/components/` (ex.: `<Módulo>Page.tsx`). Sem router por enquanto (abas via contexto).
5. **Construir coisa por coisa**: o usuário valida cada módulo antes do próximo. Não pular etapas nem criar funcionalidades fora do escopo combinado.
6. **Toda entrega é versionada no GitHub** (commit + push) **e publicada no site online automaticamente**: rode `docker compose up -d --build` ao final da rodada para o container de produção (`soberano-rp-soberano-rp-1`) servir a versão nova. Ao final de cada rodada, atualize a seção "Estado atual" deste arquivo.
7. Não guardar senha em texto puro; não logar/expor segredos; não criar arquivos além do necessário.

## Como rodar

```bash
cd /home/ubuntu/Soberano-RP
bun install        # ou npm install
bun dev            # servidor dev na porta 3000 (express + vite)
bun run lint       # tsc --noEmit
bun run build      # gera dist/ + server
```

Depois de editar o banco, rode `supabase/schema.sql` no **SQL Editor** do projeto Supabase (não há como rodar DDL pela anon key).

**Subir as mudanças para o site online (produção):**
```bash
docker compose up -d --build   # reconstrói e reinicia o container soberano-rp-soberano-rp-1
```
Rodar isso ao final de toda entrega faz as modificações aparecerem na URL pública (APP_URL). Verificar depois com `docker ps` e `curl -s http://127.0.0.1:3005/api/health`.

## Roadmap planejado (ordem sugerida)

- [x] Fundação: scaffold, auth de cidadão, layout dark, 27 UFs
- [x] Carteira/PIX (saldo, chaves, enviar PIX, extrato)
- [ ] Emprego / renda (primeiro trabalho do cidadão gera salário)
- [x] Perfil do cidadão mais completo (bio, avatar, telefone, endereço)
- [ ] Cadastro de empresas / comércio
- [ ] Eleições e cargos (municipal/estadual/federal), partidos
- [ ] Governo: leis, orçamento, obras, indicadores por UF
- [ ] Multas/justiça/polícia (RP de vida + segurança)
- [ ] Eventos + NPCs com IA (Gemini) — futuramente

## Sugestões de próximos passos para uma IA neste repo

Ao iniciar tarefa: releia este arquivo, cheque `git status`/`git log`, e rode `bun run lint` antes de terminar. Mude uma peça por vez e mantenha o padrão de RPCs/envelopes acima.
