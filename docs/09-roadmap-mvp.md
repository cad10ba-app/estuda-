# 09 — Roadmap e MVP

## Épicos
| Épico | Nome | Requisitos | Fase |
|---|---|---|---|
| EPIC-1 | Fundações: onboarding, perfil, disciplinas, prazos | REQ-001–004 | MVP |
| EPIC-2 | Planejador automático | REQ-005–008 | MVP |
| EPIC-3 | Timer, sessões e notificações | REQ-009–011, 030 | MVP |
| EPIC-4 | Flashcards e revisão espaçada | REQ-012–014 | MVP |
| EPIC-5 | Técnicas avançadas: simulados, notas, Feynman, SQ3R | REQ-015–017, 019 | v1 |
| EPIC-6 | Projetos longos (TCC/dissertação/tese) | REQ-020–025 | v1 |
| EPIC-7 | Progresso, retrospectiva, gamificação, responsáveis | REQ-026–029 | v1 |
| EPIC-8 | Extras: mapas, ENEM, IA | REQ-018, 033, 034 | v2 |
| EPIC-9 | Offline, PWA, sync, LGPD | REQ-031–032, 035 | MVP (offline/LGPD) + v1 (sync nuvem) |

## Fases
### Fase 0 — Preparação (1–2 sem)
Validar documentação, entrevistas com 5–10 alunos por nível, protótipo Figma das telas Hoje/Plano/Foco, decisões em `10`.

### Fase 1 — MVP como PWA instalável (8–10 sem)
- Monorepo (`apps/web`, `packages/*`), CI, design system base; PWA instalável (manifest + service worker).
- EPIC-1, 2, 3, 4 e offline local (EPIC-9 parcial).
- Perfis por nível (defaults) e exportar/excluir dados.
- **Critério de saída**: usuário configura disciplinas e prazos e recebe plano semanal; completa sessão com timer; revisões agendadas e notificadas; funciona offline. Beta fechado com ~50 alunos.

### Fase 2 — v1 (8–12 sem)
- EPIC-5, 6, 7 e sync em nuvem; painel do responsável com consentimento (Fund. II).
- **Saída**: retenção D30 ≥ 20% no beta; ≥ 50% dos projetos com marcos cumpridos.

### Fase 3 — v2
- EPIC-8 (mapas, trilha ENEM, IA opt-in), FSRS, aprendizado do histórico, integração com calendários.
- **App nativo** (Capacitor sobre o mesmo web app, ou Expo reutilizando `engine`/`core`) se lembretes locais ou lojas forem necessários.

## Backlog inicial (ordem sugerida)
1. Setup do monorepo (Vite + React + TS PWA, Vitest, CI). ✅
2. `packages/engine`: pontuação de prioridade + alocação em janelas (com testes) — REQ-006. ✅
3. `packages/core` (portas `Repository`/`Notifier`/`Clock`) e `packages/data` (Dexie) — `06`, `07`. ✅ (esqueleto: `StudyStore`, `planWeek`, `DexieStore`, tela Hoje, .ics)
4. Onboarding + perfil por nível — REQ-001. ✅
5. CRUD disciplinas/prazos — REQ-002, 004. ✅ (tópicos — REQ-003 pendente)
6. Tela Plano + edição/travamento — REQ-005, 008.
7. Replanejamento — REQ-007.
8. Timer e sessões — REQ-009–010. ✅
9. Lembretes: tela Hoje, exportação `.ics` e Web Push — REQ-030.
10. Decks/cartões + SM-2 + revisão do dia — REQ-012–014.
11. LGPD: exportar/excluir — REQ-032.

## Riscos de cronograma
Motor de planejamento (iterar com usuários reais), conformidade para menores, Web Push no iOS (exige PWA instalado) — mitigados com protótipos antecipados (ver `10`).
