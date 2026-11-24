# 08 — UX mobile-first

## Princípios
- Uma mão, polegar: ações principais na metade inferior; botão central de **Iniciar foco**.
- Hoje primeiro: a tela inicial responde "o que estudo agora?" em 1 olhar.
- Poucas decisões: o app sugere, o usuário confirma ou ajusta.
- Estados vazios guiados; microcópia curta e adaptada ao nível.
- Acessibilidade: alvos ≥ 44 pt, contraste AA, modo escuro, fonte dinâmica.

## Navegação (tab bar, 5 itens)
1. **Hoje** — próximo bloco, revisões vencidas, meta do dia, sequência
2. **Plano** — calendário semanal (arrastar blocos, travar, ver conflitos)
3. **Foco** (central) — timer / sessão atual
4. **Estudar** — disciplinas, tópicos, decks, notas, simulados
5. **Progresso** — relatórios, conquistas; (**Projetos** como aba extra para Superior/Pós, substituindo "Estudar" na barra se predominante)

## Fluxos principais
1. **Onboarding (≤ 2 min)**: nível → idade → objetivo (provas, ENEM, TCC…) → disciplinas (sugestões por série/curso) → disponibilidade (grade rápida) → plano da 1ª semana gerado e explicado.
2. **Sessão de foco**: toque em bloco → técnica sugerida → timer → fim: autoavaliação (1–5) + "o que lembrar?" (recuperação ativa) → agenda revisões.
3. **Revisão do dia**: fila de cartões com 4 botões (errei / difícil / bom / fácil).
4. **Perdi um bloco**: toast "Replanejar?" → resumo de mudanças → confirmar.
5. **Criar projeto longo**: modelo → data final → horas/semana → marcos gerados → meta diária.
6. **Retrospectiva semanal** (domingo): 3 perguntas + ajuste sugerido.

## Telas principais
Hoje, Plano semanal, Detalhe do bloco, Timer, Revisão, Disciplinas/Tópicos, Editor de nota (Cornell/Feynman), Simulado, Projeto (linha do tempo de marcos), Referências, Progresso, Configurações/Privacidade, Painel do responsável.

## Adaptação por nível
| Elemento | Fund. II | Médio | Superior | Pós |
|---|---|---|---|---|
| Tom | Lúdico, emojis moderados | Motivacional | Objetivo | Sóbrio |
| Gamificação | XP, avatar, conquistas | Sequência e metas | Sequência discreta | Progresso de marcos |
| Densidade | Baixa | Média | Média/alta | Alta |
| Sessão máx. sugerida | 25 min | 50 min | 50 min | 90 min |
| Notificações | Moderadas, silêncio 20h | Moderadas | Mínimas | Mínimas |

## Gamificação (sem dark patterns)
Sequência com "congelamento" semanal (evita culpa), conquistas por hábitos (não só por tempo), nenhum ranking público para menores, sem perda punitiva. Metas realistas e reconhecimento de descanso.

## Design system
Tokens de cor/tipografia/espaçamento em `packages/ui`; cor por disciplina; componentes: Card de bloco, Timer, Cartão flip, Linha do tempo de marcos, Gráfico de aderência.
