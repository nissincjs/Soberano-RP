# Brasil Soberano RP

> Jogo de roleplay brasileiro, multijogador e web, apresentado como um **site/dashboard governamental dark**. Tema híbrido de **vida + política**: o jogador é um cidadão que vive, trabalha, movimenta dinheiro e pode subir na política (vereador → prefeito → governador → presidente). Este arquivo é a fonte de contexto do projeto — leia antes de mexer no código.

## Estado atual (o que já está pronto)

- **Base**: React 19 + Vite + TypeScript + Tailwind CSS v4 (Vite plugin) + lucide-react + express (servidor). `bun` e `npm` suportados.
- **Auth de cidadão**: cadastro/login por CPF **ou** e-mail + senha (bcrypt via pgcrypto). Feito com funções `security definer` no Supabase (`register_citizen`, `login_citizen`, `get_citizen`) chamadas via RPC. A "sessão" é um id de cidadão guardado no `localStorage` (`brasil_soberano_active_user`) — **sem Supabase Auth por enquanto**.
- **Layout**: Sidebar + TopNavbar + tema dark (`#090a0f` / cards `#0c0e14` / bordas `#1e222d`, acentos `emerald`). Abas controladas por `activeTab` no `BrasilSoberanoContext`.
- **Cadastro base**: 27 UFs brasileiras em `src/data/mockInitialData.ts` (mock estático, ainda não é tabela).
- **Carteira/PIX** (primeiro módulo de jogo): cada cidadão tem `balance_cents` (saldo em **centavos**, R$ 5.000,00 de boas-vindas gravado como depósito inicial), envia PIX por CPF/e-mail, vê extrato. Ver `WalletPage` + RPCs `wallet_get`, `wallet_find_recipient`, `pix_send`.

## Stack / Infra

- Repo: `github.com/nissincjs/Soberano-RP` (a pasta local é `/home/ubuntu/Soberano-RP`).
- Banco: Supabase (Postgres). **O `schema.sql` é idempotente e é a única fonte de verdade do banco** — sempre edite o arquivo e rode ele inteiro no SQL Editor do Supabase.
- Deploy: Docker (`Dockerfile` + `docker-compose.yml`) servindo o SPA + express. Vars em `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `APP_URL`).

## Convenções e invariantes (NÃO quebrar)

1. **UI sempre em pt-BR** (textos, erros, datas, moeda). Nomes de variáveis/código em inglês.
2. **Dinheiro é sempre inteiro de centavos** (`bigint` no banco, `number`/string no cliente). Nunca `float`/`double` para valores monetários. Formatar com `src/lib/format.ts` (`formatBRL`).
3. **Padrão Supabase**: tabelas com RLS ativada; acesso só por funções `security definer` que devolvem envelope `{ ok, error?, ... }` com erros em snake_case curtos (ex.: `saldo_insuficiente`). Cliente não acessa tabelas direto.
4. **Módulos de UI**: cada módulo novo = um item novo na Sidebar + um case no renderizador de abas do `App.tsx` + página em `src/components/` (ex.: `<Módulo>Page.tsx`). Sem router por enquanto (abas via contexto).
5. **Construir coisa por coisa**: o usuário valida cada módulo antes do próximo. Não pular etapas nem criar funcionalidades fora do escopo combinado.
6. **Toda entrega é versionada no GitHub** (commit + push). Ao final de cada rodada, atualize a seção "Estado atual" deste arquivo.
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

## Roadmap planejado (ordem sugerida)

- [x] Fundação: scaffold, auth de cidadão, layout dark, 27 UFs
- [x] Carteira/PIX (saldo, chaves, enviar PIX, extrato)
- [ ] Emprego / renda (primeiro trabalho do cidadão gera salário)
- [ ] Perfil do cidadão mais completo (bio, avatar, telefone, endereço)
- [ ] Cadastro de empresas / comércio
- [ ] Eleições e cargos (municipal/estadual/federal), partidos
- [ ] Governo: leis, orçamento, obras, indicadores por UF
- [ ] Multas/justiça/polícia (RP de vida + segurança)
- [ ] Eventos + NPCs com IA (Gemini) — futuramente

## Sugestões de próximos passos para uma IA neste repo

Ao iniciar tarefa: releia este arquivo, cheque `git status`/`git log`, e rode `bun run lint` antes de terminar. Mude uma peça por vez e mantenha o padrão de RPCs/envelopes acima.
