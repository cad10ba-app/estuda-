# 10 — Riscos e perguntas abertas

## Riscos
| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| R1 | Plano automático ruim gera abandono | Alto | Explicar sugestões, edição fácil, iterar com beta, retrospectiva semanal |
| R2 | Conformidade com menores (LGPD art. 14, ECA Digital) | Alto | Consultoria jurídica antes do lançamento; consentimento parental; coleta mínima |
| R3 | Excesso de funcionalidades no MVP | Médio | Respeitar MoSCoW; MVP = EPIC-1–4 |
| R4 | Retenção baixa (apps de estudo têm churn alto) | Alto | Hábito leve, "só 5 min", gamificação não punitiva, metas realistas |
| R5 | Notificações locais limitadas por SO (economia de bateria) | Médio | Reagendar a cada abertura, testes em aparelhos reais |
| R6 | Sync com conflitos | Médio | LWW por campo, revisões append-only, testes de conflito |
| R7 | Evidência das técnicas varia por idade | Médio | Defaults conservadores, tornar tudo configurável, revisar com educadores/psicopedagogos |
| R8 | Dependência de IA/LLM com menores | Médio | Opt-in, desativado para menores, privacidade |

## Perguntas abertas (decidir na Fase 0)
1. **Monetização**: gratuito + premium? Escolas/famílias? (afeta arquitetura de contas).
2. **Plataforma inicial**: iOS e Android juntos ou um primeiro?
3. **Stack**: confirmar React Native/Expo + Supabase ou preferir outra (Flutter, backend próprio).
4. **Conteúdo pré-carregado**: listas de disciplinas/tópicos por série/curso (BNCC, ENEM) — fonte e manutenção?
5. **Idade mínima** e fluxo de consentimento parental (verificação).
6. **Integrações**: calendário (Google/Apple), Google Classroom, importação de grade curricular?
7. **Identidade/nome** do produto e marca.
8. **Validação pedagógica**: parceria com educadores/pesquisadores para revisar defaults por faixa etária.
9. **Normas de projetos**: variar por instituição (ABNT vs APA vs normas internas) — quão configurável?
10. **Modo social** (grupos de estudo) entra em quando, e como proteger menores?
