# 01 — Catálogo de técnicas de estudo

> **Revisado em 25/11/2026:** os graus de evidência abaixo foram reavaliados com a base de `docs/14-base-de-evidencia.md` (fontes citadas, ainda em revisão por especialista). Versões anteriores classificavam intercalação, Pomodoro e deep work de forma otimista demais.

Evidência: **Forte** (várias meta-análises/estudos), **Moderada**, **Limitada**, **Não avaliada** (sem fonte conferida). Referências gerais: Dunlosky et al. (2013), Roediger & Karpicke (2006), Cepeda et al. (2006), Cirillo (Pomodoro).

| ID | Técnica | Evidência | Para quê | Parâmetros configuráveis | Implementação no app |
|----|---------|-----------|----------|--------------------------|----------------------|
| TEC-01 | **Recuperação ativa** (flashcards, autoquestionamento) | Forte | Fixar conteúdo lembrando sem consultar | tamanho do deck, tipo (frente/verso, lacuna) | Módulo de cartões; modo "teste" após cada sessão |
| TEC-02 | **Repetição espaçada** (SM-2 / FSRS) | Forte | Reter a longo prazo | algoritmo, retenção-alvo (85–95%), limite diário | Agenda de revisões automática (`04`) |
| TEC-03 | **Intercalação** (interleaving) | Moderada (varia por conteúdo) | Discriminar problemas, transferência | nº de disciplinas por dia | Motor alterna disciplinas/tópicos nos blocos |
| TEC-04 | **Prática distribuída** | Forte | Evitar "virada de noite" | janela de dias antes da prova | Plano espalha carga até o prazo |
| TEC-05 | **Pomodoro** (25/5, 15/3, 50/10) | Limitada | Foco e pausas | foco, pausa curta/longa, ciclos | Timer integrado, preset por perfil |
| TEC-06 | **Deep work** (blocos longos sem interrupção) | Não avaliada | Trabalho cognitivo profundo (pós/escrita) | 60–120 min | Modo foco com bloqueio de notificações |
| TEC-07 | **Técnica Feynman** | Moderada (indireta) | Detectar lacunas explicando em palavras simples | — | Modo "explique" com nota/áudio e checklist de lacunas |
| TEC-08 | **Método Cornell** | Não avaliada | Anotações com pistas e resumo | — | Template de nota (pistas / notas / resumo) |
| TEC-09 | **Mapas mentais/conceituais** | Limitada | Organizar relações | — | Editor simples de mapa por tópico |
| TEC-10 | **SQ3R / PQRST** | Não avaliada | Leitura ativa de textos | — | Roteiro guiado por etapas para leituras |
| TEC-11 | **Blurting** (despejo de memória) | Moderada (indireta) | Recuperação livre | tempo | Sessão: escrever tudo → comparar → marcar lacunas |
| TEC-12 | **Time-blocking** | Não avaliada | Reservar horários | janelas diárias | Calendário de blocos gerado pelo motor |
| TEC-13 | **Matriz de Eisenhower / MoSCoW** | Não avaliada | Priorizar tarefas | — | Classificação urgente × importante nas tarefas |
| TEC-14 | **Simulados e questões** | Forte (testagem) | Treino em condição de prova | tempo, nº de questões | Módulo de simulado cronometrado + análise de erros |
| TEC-15 | **Retrospectiva semanal** | Não avaliada | Metacognição, ajuste do plano | dia da semana | Relatório + 3 perguntas guiadas; replaneja |
| TEC-16 | **Regra dos 2 minutos / início mínimo** | Não avaliada | Vencer procrastinação | — | Botão "só 5 min" para iniciar |
| TEC-17 | **Método de loci / mnemônicos** | Não avaliada | Memorizar listas | — | Guia para criar associações |
| TEC-18 | **Fichamento e gestão de literatura** | Não avaliada | Pesquisa acadêmica | formato ABNT | Módulo de referências (`05`) |

## Regras de seleção
1. Técnicas de evidência **Forte** (TEC-01, 02, 04, 14) entram por padrão em todos os perfis.
2. Pomodoro/Deep work são escolhidos pelo perfil de idade/nível (`02`).
3. O aluno pode ativar/desativar técnicas; o app explica o porquê de cada sugestão em 1 frase.
