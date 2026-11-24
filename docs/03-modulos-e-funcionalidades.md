# 03 — Módulos e funcionalidades

Prioridade MoSCoW: **M** (must/MVP), **S** (should/v1), **C** (could/v2). Épicos em [`09`](09-roadmap-mvp.md).

## Módulos
1. Onboarding e perfil
2. Disciplinas e conteúdos
3. Planejador automático
4. Timer e sessões de estudo
5. Revisão espaçada e flashcards
6. Simulados e questões
7. Notas (Cornell, Feynman, mapas)
8. Projetos longos (TCC, dissertação, tese)
9. Progresso, relatórios e gamificação
10. Responsáveis (só Fund. II)
11. Configurações, notificações e privacidade

## Requisitos

| ID | Requisito | Módulo | Prio | Épico | Técnicas |
|----|-----------|--------|------|-------|----------|
| REQ-001 | Onboarding coleta nível, idade, rotina e objetivo; define perfil padrão | 1 | M | EPIC-1 | — |
| REQ-002 | Cadastro de disciplinas com peso, dificuldade e cor | 2 | M | EPIC-1 | TEC-13 |
| REQ-003 | Hierarquia disciplina → conteúdo/tópico com status (não visto/estudando/dominado) | 2 | M | EPIC-1 | TEC-04 |
| REQ-004 | Cadastro de prazos (prova, entrega, simulado) por disciplina | 2 | M | EPIC-1 | TEC-04 |
| REQ-005 | Disponibilidade semanal (janelas de estudo) | 3 | M | EPIC-2 | TEC-12 |
| REQ-006 | Geração automática do plano semanal em blocos | 3 | M | EPIC-2 | TEC-03, 04, 12 |
| REQ-007 | Replanejamento automático ao perder/adiar blocos | 3 | M | EPIC-2 | TEC-04 |
| REQ-008 | Edição manual de blocos (mover, trocar, bloquear) sem quebrar o plano | 3 | M | EPIC-2 | — |
| REQ-009 | Timer com presets por perfil (Pomodoro/50-10/deep work) | 4 | M | EPIC-3 | TEC-05, 06 |
| REQ-010 | Registro de tempo real vs planejado por sessão | 4 | M | EPIC-3 | — |
| REQ-011 | Botão "começar só 5 min" | 4 | S | EPIC-3 | TEC-16 |
| REQ-012 | Decks e cartões (frente/verso, lacuna) | 5 | M | EPIC-4 | TEC-01 |
| REQ-013 | Agendamento de revisões (SM-2 no MVP; FSRS depois) | 5 | M | EPIC-4 | TEC-02 |
| REQ-014 | Revisões geradas automaticamente após estudar um tópico (D+1/7/30) | 5 | M | EPIC-4 | TEC-02 |
| REQ-015 | Simulado cronometrado e análise de erros por tópico | 6 | S | EPIC-5 | TEC-14 |
| REQ-016 | Modo blurting e modo Feynman | 7 | S | EPIC-5 | TEC-07, 11 |
| REQ-017 | Notas com template Cornell | 7 | S | EPIC-5 | TEC-08 |
| REQ-018 | Mapas mentais simples | 7 | C | EPIC-8 | TEC-09 |
| REQ-019 | Roteiro SQ3R para leituras | 7 | S | EPIC-5 | TEC-10 |
| REQ-020 | Criar projeto longo a partir de modelo (TCC/dissertação/tese/artigo) | 8 | S | EPIC-6 | — |
| REQ-021 | Marcos com datas por engenharia reversa da entrega | 8 | S | EPIC-6 | TEC-12 |
| REQ-022 | Meta diária de escrita/leitura integrada ao plano | 8 | S | EPIC-6 | TEC-06 |
| REQ-023 | Gestor de referências/fichamentos com exportação ABNT | 8 | S | EPIC-6 | TEC-18 |
| REQ-024 | Alerta de risco de atraso do projeto | 8 | S | EPIC-6 | — |
| REQ-025 | Registro de reuniões com orientador | 8 | C | EPIC-6 | — |
| REQ-026 | Painel de progresso e relatório semanal | 9 | S | EPIC-7 | TEC-15 |
| REQ-027 | Retrospectiva semanal guiada que ajusta o plano | 9 | S | EPIC-7 | TEC-15 |
| REQ-028 | Gamificação (sequência, XP, conquistas) por nível de intensidade | 9 | S | EPIC-7 | — |
| REQ-029 | Vínculo de responsável com consentimento e resumo semanal | 10 | S | EPIC-7 | — |
| REQ-030 | Notificações locais inteligentes (início de bloco, revisões vencidas) | 11 | M | EPIC-3 | — |
| REQ-031 | Funcionamento offline e sincronização | 11 | M | EPIC-9 | — |
| REQ-032 | Exportar/excluir dados (LGPD) | 11 | M | EPIC-9 | — |
| REQ-033 | Trilha ENEM/vestibular (pesos por área, contagem regressiva, redação) | 6 | C | EPIC-8 | TEC-14 |
| REQ-034 | Geração de cartões/resumos por IA a partir de textos do aluno | 5 | C | EPIC-8 | TEC-01 |

## Critérios de aceite (exemplos)
- **REQ-006**: dado 4 disciplinas, 2 provas em 10 dias e 12 h/semana disponíveis, o plano aloca 100% das horas respeitando janelas e nunca deixa uma disciplina com prazo ≤ 7 dias sem bloco na semana.
- **REQ-007**: ao marcar um bloco como perdido, o motor replaneja em ≤ 2 s offline e informa o que mudou.
- **REQ-013**: um cartão respondido "fácil" aumenta o intervalo conforme o algoritmo; cartões vencidos aparecem no bloco de revisão do dia, limitados ao teto diário.
- **REQ-021**: ao informar data de defesa, todos os marcos recebem datas decrescentes com folga ≥ 10% antes da entrega.
- **REQ-029**: menor de 14 anos só conclui cadastro após confirmação do responsável.

## User stories (amostra)
- Como aluno do Médio, quero que o app monte minha semana por disciplina para não decidir o que estudar a cada dia.
- Como universitário, quero cadastrar uma prova e receber revisões espaçadas até a data.
- Como mestranda, quero informar a data da defesa e ver os marcos e a meta diária de escrita.
- Como responsável, quero ver a frequência de estudo da criança sem ler suas anotações.
