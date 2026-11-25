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
