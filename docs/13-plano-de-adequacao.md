# 13 — Plano de adequação ao documento de arquitetura funcional

Fonte de verdade de produto: [`12-estuda-arquitetura-funcional.md`](12-estuda-arquitetura-funcional.md). Em caso de conflito com os docs 00–11, vale o doc 12. O app mantém o nome **Estuda** (o documento usa "ESTUDA+").

## Decisões desta rodada
- Backend: **local primeiro** (IndexedDB). Sem login por enquanto; modelo e camadas prontos para Supabase + RLS (doc 12, §9–10).
- Modos de uso: **Fundamental (anos finais)**, **Médio**, **Superior**, **Pesquisa** (TCC a doutorado) e **Objetivo livre**. Sem modo Infantil.
- Nomes internos mantidos para evitar migração de dados: `fund2` = Fundamental, `pos` = Pesquisa, `livre` = Objetivo livre.

## Mapeamento: documento × aplicação
| Doc 12 | Estado anterior | Ação |
|---|---|---|
| §5.3 Biblioteca de técnicas (15) | 4 técnicas implícitas (timer, SM-2) | Catálogo completo; 4 ativas no MVP (Pomodoro, Recuperação ativa, Repetição espaçada, Prática de exercícios) |
| §5.4 Motor de recomendação com justificativa | inexistente | `engine/recommendation.ts` — regras da tabela do doc, justificativa, passos, verificação |
| §6 Aplicação assistida (Usar / Trocar / Personalizar) | inexistente | Detalhe da sessão com as 3 opções; escolha registrada |
| §5.6 Executor de sessões em etapas | timer único | Sessão em etapas, pausar/encerrar/trocar técnica |
| §5.8 Avaliação pós-sessão; atividade × desempenho × percepção × progresso | só tempo | Dificuldade, confiança e resultado; progresso separado nas 4 dimensões |
| §5.2 Objetivo → Disciplina → Unidade → Tópico → Tarefa | Disciplina → Tópico | Adicionar Objetivo, Unidade e Tarefa; projeto → etapa → entregável → tarefa |
| §8 Navegação (Início, Meu plano, Conteúdos/Projetos, Técnicas, Progresso, Perfil) | Hoje, Plano, Foco, Revisar, Mais | Nova navegação; Revisar vira parte do Início/Progresso |
| §3 Perfil: autonomia, acessibilidade | só nível | Autonomia, objetivo principal, preferências de acessibilidade |
| §7 Automações (resultado baixo → prática extra, semana encerrada → resumo) | parcial | Completar gatilhos do doc |
| §10 Modelo de dados | `06-modelo-de-dados.md` | Atualizar para as entidades do doc 12 |

## Etapas
1. **Técnicas e recomendação** (engine): catálogo, regras, passos de sessão.
2. **Conteúdo hierárquico e perfil** (core/data): objetivos, unidades, tarefas, autonomia, acessibilidade.
3. **Sessão assistida** (core + UI): detalhe da sessão, executor em etapas, avaliação pós-sessão, gatilhos.
4. **Navegação e telas** (UI): reorganização conforme §8; onboarding por modo.
5. **Progresso** com as 4 dimensões e indicadores de validação (§14).
6. Atualizar docs 03, 06, 09 e README.

## Estado da adequação
| Item do doc 12 | Estado |
|---|---|
| §3 Modos (Fundamental, Médio, Superior, Pesquisa, Objetivo livre) e autonomia | ✅ onboarding em 5 passos; trocar modo no Perfil |
| §5.2 Objetivo → Disciplina → Unidade → Tópico → Tarefa | ✅ (Conteúdos). Projeto → Etapa → Entregável: marcos existem; tarefas por etapa ainda não ligadas na UI |
| §5.3 Biblioteca de técnicas (15) | ✅ catálogo; 4 ativas, 11 "em breve" |
| §5.4 Recomendação com justificativa | ✅ regras da tabela do doc; variação após uso repetido |
| §5.5 Planejador | ✅ (já existia) + objetivo com prazo gera prazo da disciplina |
| §5.6 Executor em etapas (pausar, encerrar, trocar técnica) | ✅ |
| §5.7 Revisão (cartões + revisões de tópico) | ✅ |
| §5.8 Atividade × desempenho × percepção × progresso | ✅ tela Progresso |
| §6 Usar / Trocar / Personalizar, com registro | ✅ registrado em cada sessão |
| §7 Automações (resultado baixo, sessão perdida, semana encerrada) | ✅ parcial: resultado baixo, sessão perdida, resumo semanal; alerta de prazo próximo pendente |
| §8 Navegação (6 itens) | ✅ |
| §9 Supabase, autenticação, RLS | ⏳ local primeiro (decisão do usuário); camadas prontas para trocar |
| Notificações PWA | ⏳ |
| Modo Infantil / responsáveis | fora do escopo desta fase |
