# 07 — Arquitetura técnica

## Decisões (propostas, revisáveis em `10`)
| Camada | Escolha | Motivo |
|---|---|---|
| App | React Native + Expo + TypeScript | iOS/Android com um código, OTA updates |
| Navegação | Expo Router | Rotas por arquivo, deep links |
| Estado | Zustand + TanStack Query | Simples, cache de sync |
| Banco local | SQLite (expo-sqlite) + Drizzle ORM | Offline-first, migrações tipadas |
| Backend | Supabase (Postgres, Auth, RLS) | Rápido para MVP, RLS para privacidade |
| Sync | Fila de mudanças local → push/pull por `updated_at` | Simples e auditável |
| Notificações | `expo-notifications` locais (agendadas no dispositivo) | Funciona offline, sem servidor |
| Motor | Pacote TS puro `packages/engine` | Testável, reutilizável (futuro web) |
| Testes | Jest (engine/unit), Maestro/Detox (e2e), Playwright p/ web preview | |
| CI | GitHub Actions: lint, typecheck, test | |

## Estrutura de repositório sugerida
```
apps/mobile/        # app Expo
packages/engine/    # motor de automação (04)
packages/db/        # schema, migrações, repositórios (06)
packages/ui/        # design system
docs/
```

## Offline-first e sincronização
1. Toda escrita vai ao SQLite e a uma tabela `outbox`.
2. Em rede, enviar `outbox` ao Supabase (idempotente por `id` + `updated_at`) e puxar mudanças desde o último `sync_token`.
3. Resolução: LWW por campo; revisões e sessões são append-only.
4. O motor roda **sempre local**; o servidor não é necessário para planejar.

## Notificações e automação em background
- Agendar localmente os próximos 7 dias de lembretes (início de bloco, revisões vencidas), reagendar após cada replanejamento.
- Respeitar horários de silêncio por perfil (Fund. II: sem notificação após 20h).

## Segurança, privacidade e conformidade
- **LGPD**: base legal, minimização, exportação/exclusão (REQ-032); **art. 14** consentimento específico de responsável para menores; **ECA Digital** (Lei 15.211/2025): verificação de idade proporcional, sem perfilamento publicitário de menores — validar com jurídico.
- Sem anúncios segmentados para Fund. II; sem chat público.
- Auth: e-mail + OAuth (Google/Apple); Apple Sign-In obrigatório se houver login social no iOS.
- RLS: usuário só acessa suas linhas; responsável só vê agregados (não `Nota` privada).
- Criptografia em trânsito (TLS) e em repouso; backups.
- Telemetria opt-in, sem dados de conteúdo.

## Acessibilidade e i18n
Textos em pt-BR via i18n (preparado para en/es), tamanhos dinâmicos, contraste AA, leitor de tela.

## IA (v2)
Geração de cartões/resumos a partir de textos do aluno via API de LLM, sempre opt-in, com envio mínimo de conteúdo e sem dados identificáveis; para menores, desativado por padrão.

## Observabilidade
Sentry (erros), métricas de produto (ativação, retenção, aderência) anonimizadas.
