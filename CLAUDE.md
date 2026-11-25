# CLAUDE.md

Projeto **Estuda**: app mobile-first de técnicas de estudo (Fund. II, Médio, Superior, Pós). Fase atual: planejamento em `docs/` (pt-BR).

- **Fonte de verdade de produto: `docs/12-estuda-arquitetura-funcional.md`** (prevalece sobre os demais); adequação em `docs/13-plano-de-adequacao.md`. O app mantém o nome Estuda.
- Ler `README.md` (índice) antes de qualquer trabalho; a fonte de verdade de requisitos é `docs/03-modulos-e-funcionalidades.md`, e do algoritmo é `docs/04-motor-de-automacao.md`.
- Manter IDs (`TEC-`, `REQ-`, `EPIC-`, `ENT-`) estáveis e atualizar referências cruzadas ao alterar docs.
- MVP = **PWA instalável** (React + Vite + TS, Dexie, Supabase), preparado para nativo (Capacitor/Expo). Regras de negócio só em `packages/engine` e `packages/core`, sem APIs de navegador. Ver `docs/07-arquitetura-tecnica.md`.
- Modos: Fundamental (anos finais), Médio, Superior, Pesquisa e Objetivo livre. Sem modo Infantil. IDs internos: `fund2`, `medio`, `superior`, `pos` (= Pesquisa), `livre`.
- Backend: local primeiro (IndexedDB); Supabase só quando o usuário fornecer o projeto.
- Desenvolver na branch `claude/mobile-study-app-planning-8akscx`; não abrir PR sem pedido.
