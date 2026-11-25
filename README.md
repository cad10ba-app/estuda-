# Estuda — App mobile-first de técnicas de estudo

App que organiza o estudo de alunos do **Ensino Fundamental II (anos finais), Ensino Médio, Ensino Superior e Pós-graduação**, aplicando técnicas de estudo adequadas à idade e ao nível, com **automação** do planejamento (tempo, disciplinas, conteúdos, revisões) e módulo para **projetos longos** (TCC, dissertação, tese).

## Índice da documentação

| # | Documento | Conteúdo |
|---|-----------|----------|
| 00 | [Visão e escopo](docs/00-visao-e-escopo.md) | Problema, personas, princípios, não-objetivos, métricas |
| 01 | [Técnicas de estudo](docs/01-tecnicas-de-estudo.md) | Catálogo `TEC-xx` com evidência e implementação |
| 02 | [Perfis por idade e nível](docs/02-perfis-por-idade-e-nivel.md) | Matriz nível × técnicas × UX |
| 03 | [Módulos e funcionalidades](docs/03-modulos-e-funcionalidades.md) | Requisitos `REQ-xxx`, user stories, prioridade |
| 04 | [Motor de automação](docs/04-motor-de-automacao.md) | Algoritmo de planejamento e revisões |
| 05 | [Projetos longos (TCC etc.)](docs/05-projetos-longos-tcc.md) | Marcos, metas de escrita, referências |
| 06 | [Modelo de dados](docs/06-modelo-de-dados.md) | Entidades e relacionamentos |
| 07 | [Arquitetura técnica](docs/07-arquitetura-tecnica.md) | Stack, offline-first, LGPD |
| 08 | [UX mobile-first](docs/08-ux-mobile-first.md) | Navegação, telas, gamificação, acessibilidade |
| 09 | [Roadmap e MVP](docs/09-roadmap-mvp.md) | Épicos `EPIC-x`, fases, backlog |
| 10 | [Riscos e perguntas abertas](docs/10-riscos-e-perguntas-abertas.md) | Decisões pendentes |
| 11 | [Deploy do PWA](docs/11-deploy.md) | Publicação no GitHub Pages e instalação no celular |
| 12 | [Arquitetura funcional (referência de produto)](docs/12-estuda-arquitetura-funcional.md) | Documento que prevalece sobre os demais |
| 13 | [Plano de adequação](docs/13-plano-de-adequacao.md) | Mapeamento doc 12 × aplicação e etapas |

## Convenções
- Idioma: pt-BR. IDs rastreáveis: `TEC-xx` (técnica), `REQ-xxx` (requisito), `EPIC-x` (épico), `ENT-xx` (entidade).
- Status: documentação de planejamento + MVP local funcional (`packages/engine`, `packages/core`, `packages/data`, `apps/web`).
- Rodar: `npm install` e `npm run dev`. Testes: `npm test`. Build: `npm run build`.
