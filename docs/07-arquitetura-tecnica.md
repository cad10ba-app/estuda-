# 07 — Arquitetura técnica

## Decisão: MVP como PWA (web app instalável), preparado para nativo
O MVP é um **web app mobile-first instalável no celular (PWA)**, sem lojas de aplicativo. A arquitetura separa regras de negócio e dados da interface para permitir um app nativo depois **sem reescrever o núcleo**.

| Camada | MVP (PWA) | Evolução (nativo) |
|---|---|---|
| UI | React + Vite + TypeScript, `vite-plugin-pwa` (manifest, service worker, instalável) | Capacitor (empacota o mesmo web app em iOS/Android) **ou** React Native/Expo reutilizando `engine` e `core` |
| Estilo/componentes | CSS com tokens (`packages/ui`), layout responsivo mobile-first | Mesmos tokens |
| Estado | Zustand + TanStack Query | Idem |
| Banco local | IndexedDB via Dexie, atrás da interface `Repository` (porta) | SQLite (Capacitor/Expo) implementando a mesma porta |
| Backend | Supabase (Postgres, Auth, RLS) | Idem |
| Sync | Fila `outbox` local → push/pull por `updated_at` | Idem |
| Lembretes | Web Push (VAPID) enviado por servidor + lembretes dentro do app + exportação `.ics` | Notificações locais nativas |
| Motor | `packages/engine` (TS puro) | Idem |
| Testes | Vitest (engine/core), Playwright (e2e web) | + testes nativos |
| CI | GitHub Actions: typecheck, test, build | + builds mobile |

### Estrutura de repositório
```
apps/web/           # PWA (MVP)
apps/mobile/        # (futuro) Capacitor/Expo; só consome packages/*
packages/engine/    # motor de automação (04) — já existe
packages/core/      # domínio: tipos, regras, casos de uso, portas (Repository, Notifier, Clock)
packages/data/      # adaptadores: Dexie (web), Supabase sync; futuro SQLite
packages/ui/        # design system (tokens + componentes web)
docs/
```

### Regras para manter o caminho aberto ao nativo
1. **Nenhuma regra de negócio na UI**: tudo em `engine`/`core`; a UI só chama casos de uso.
2. **Portas e adaptadores**: `Repository`, `Notifier`, `Clock`, `Storage` são interfaces em `core`; o web injeta Dexie/Web Push, o nativo injeta SQLite/notificações locais.
3. **Sem APIs exclusivas do navegador dentro de `engine`/`core`** (nada de `window`, `localStorage`, `Notification`).
4. **Datas em UTC** e `Clock` injetável (testes e fuso).
5. Navegação com rotas por URL (deep links funcionam no web e no Capacitor).

### Offline-first e sincronização
1. Toda escrita vai ao banco local (Dexie) e a uma tabela `outbox`; o service worker faz cache do app shell.
2. Com rede, enviar `outbox` ao Supabase (idempotente por `id` + `updated_at`) e puxar mudanças desde o último `sync_token`.
3. Resolução: LWW por campo; revisões e sessões são append-only.
4. O motor roda **sempre local**; o servidor não é necessário para planejar.

### Lembretes e limites da web (importante)
- Web Push exige **servidor** (job agendado que dispara no horário do bloco) e consentimento do usuário.
- **iOS**: push só funciona com o PWA **adicionado à Tela de Início** (iOS/iPadOS 16.4+); orientar no onboarding.
- Não há lembretes locais agendados confiáveis na web; por isso o app também mostra revisões/bloco do dia na tela **Hoje** e oferece exportar a agenda (`.ics`) ao calendário do celular.
- Respeitar horários de silêncio por perfil (Fund. II: sem notificação após 20h).
- Se lembretes confiáveis forem críticos, o gatilho para migrar é empacotar com Capacitor (notificações locais nativas).

## Segurança, privacidade e conformidade
- **LGPD**: base legal, minimização, exportação/exclusão (REQ-032); **art. 14** consentimento específico de responsável para menores; **ECA Digital** (Lei 15.211/2025): verificação de idade proporcional, sem perfilamento publicitário de menores — validar com jurídico.
- Sem anúncios segmentados para Fund. II; sem chat público.
- Auth: e-mail + OAuth (Google/Apple); Apple Sign-In obrigatório se houver login social em app iOS nativo (lojas).
- RLS: usuário só acessa suas linhas; responsável só vê agregados (não `Nota` privada).
- Criptografia em trânsito (TLS) e em repouso; backups.
- Telemetria opt-in, sem dados de conteúdo.

## Acessibilidade e i18n
Textos em pt-BR via i18n (preparado para en/es), tamanhos dinâmicos, contraste AA, leitor de tela.

## IA (v2)
Geração de cartões/resumos a partir de textos do aluno via API de LLM, sempre opt-in, com envio mínimo de conteúdo e sem dados identificáveis; para menores, desativado por padrão.

## Observabilidade
Sentry (erros), métricas de produto (ativação, retenção, aderência) anonimizadas.
