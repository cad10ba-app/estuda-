# 00 — Visão e escopo

## Problema
Estudantes sabem *o que* precisam estudar, mas não *como*, *quando* e *quanto*. Técnicas com forte evidência (recuperação ativa, repetição espaçada, intercalação) são pouco usadas porque exigem planejamento manual. Projetos longos (TCC, dissertação) fracassam por falta de marcos e ritmo.

## Proposta
App mobile-first que: (1) identifica o perfil do aluno (nível, idade, rotina); (2) sugere técnicas adequadas; (3) **automatiza** o plano de estudo por disciplina/conteúdo/prazo e as revisões; (4) acompanha tempo real vs planejado; (5) estrutura projetos longos em marcos e metas de escrita.

## Níveis atendidos (escopo fixo)
1. Ensino Fundamental II — anos finais (6º ao 9º, ~11–14 anos)
2. Ensino Médio (~15–18 anos; trilha opcional ENEM/vestibular)
3. Ensino Superior (graduação)
4. Pós-graduação (especialização, mestrado, doutorado)

## Personas
| Persona | Nível | Dor principal | Necessidade |
|---|---|---|---|
| Lucas, 12 | Fund. II | Distração, esquece tarefas | Sessões curtas, lúdico, lembretes; responsável acompanha |
| Marina, 17 | Médio | Muito conteúdo, ENEM | Plano por disciplina, simulados, revisão espaçada |
| Rafael, 21 | Superior | Provas + trabalhos acumulados | Agenda automática por prazos, Cornell, flashcards |
| Dra. Ana, 29 | Pós | Dissertação travada | Marcos, meta diária de escrita, fichamentos, alerta de atraso |

## Princípios
1. Mobile-first e uso com uma mão; sessão iniciada em ≤ 2 toques.
2. Evidência antes de moda: técnicas de evidência alta são padrão.
3. Automação com controle: tudo que é sugerido pode ser editado.
4. Offline-first.
5. Privacidade por padrão, especialmente para menores (LGPD / ECA Digital).
6. Adaptação por nível sem criar apps separados: mesmo núcleo, perfis diferentes.

## Não-objetivos (v1)
- Ensino Fundamental I e concursos públicos.
- Conteúdo didático próprio (aulas/vídeos); o app organiza o estudo, não ensina a matéria.
- Plataforma de escola/turma (considerado v2).
- Editor de texto completo para TCC (apenas organização, metas e referências).

## Métricas de sucesso
- Ativação: ≥ 60% dos novos usuários concluem onboarding e a 1ª sessão em 24h.
- Retenção D7 ≥ 35%, D30 ≥ 20%.
- Aderência ao plano: ≥ 60% dos blocos planejados cumpridos/semana.
- Revisões espaçadas realizadas ≥ 70% no prazo.
- Projetos longos: ≥ 50% dos marcos concluídos até a data.
