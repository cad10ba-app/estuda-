# CLAUDE.md

Projeto **Estuda**: app mobile-first de técnicas de estudo (Fund. II, Médio, Superior, Pós). Fase atual: planejamento em `docs/` (pt-BR).

- Ler `README.md` (índice) antes de qualquer trabalho; a fonte de verdade de requisitos é `docs/03-modulos-e-funcionalidades.md`, e do algoritmo é `docs/04-motor-de-automacao.md`.
- Manter IDs (`TEC-`, `REQ-`, `EPIC-`, `ENT-`) estáveis e atualizar referências cruzadas ao alterar docs.
- MVP = **PWA instalável** (React + Vite + TS, Dexie, Supabase), preparado para nativo (Capacitor/Expo). Regras de negócio só em `packages/engine` e `packages/core`, sem APIs de navegador. Ver `docs/07-arquitetura-tecnica.md`.
- Escopo fixo: apenas Fundamental II, Médio, Superior e Pós-graduação. Sem Fundamental I e sem concursos.
- Desenvolver na branch `claude/mobile-study-app-planning-8akscx`; não abrir PR sem pedido.
