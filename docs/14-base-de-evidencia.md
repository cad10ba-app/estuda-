# 14 — Base de evidência e personalização

Objetivo: tornar as recomendações do Estuda **rastreáveis, auditáveis e melhoráveis com dados reais**, sem prometer resultados. Complementa o `12-estuda-arquitetura-funcional.md` (§5.4, §14, §15).

## Princípios
1. **Regras primeiro, IA depois.** Quem decide quais técnicas são permitidas em cada contexto é uma tabela de regras baseada em literatura. Qualquer personalização futura só escolhe **dentro** do que a regra permite.
2. **Toda técnica tem grau de evidência e fontes**, visíveis ao aluno (aba *Técnicas* e *Base científica* na sessão).
3. **Honestidade sobre incerteza.** Graus: *forte*, *moderada*, *limitada*, *não avaliada*. Técnica sem fonte conferida aparece como "ainda não avaliada".
4. **Revisão humana.** Todas as entradas estão `a_revisar`; as referências estão com `verified: false` até um especialista confirmar. Código: `packages/engine/src/evidence.ts`.
5. **Preferência ≠ eficácia** (doc 12 §6): o histórico do aluno é indicação, não prova.

## Camadas implementadas (local, sem custo)
| Camada | O que faz | Onde |
|---|---|---|
| Regras baseadas em evidência | Tipo de tarefa → técnica principal e complementar; substitutas explicadas quando a ideal ainda não existe | `recommendation.ts` |
| Base de evidência | Grau, resumo, cuidados e fontes por técnica | `evidence.ts` |
| Repetição espaçada FSRS-4.5 | Estabilidade e dificuldade por cartão; intervalo para a retenção desejada (80–95%, padrão 90%); migra cartões SM-2 | `fsrs.ts`, `core/cards.ts` |
| Personalização pelos resultados | Compara técnica principal e complementar com o histórico do aluno (confiança e acertos, por tipo de tarefa) e inverte a ordem só com ≥3 sessões de cada e diferença ≥12 pontos percentuais; usa "encolhimento" para não concluir com poucos dados | `personalization.ts` |

### FSRS
Implementado conforme a documentação oficial (open-spaced-repetition/awesome-fsrs, wiki *The Algorithm*, seção FSRS-4.5, conferida em 25/11/2026). Parâmetros padrão; **não** otimizados com dados do próprio usuário ainda. Há versões mais novas (FSRS-5/6/7): atualizar exige conferir pesos e migração. Os testes verificam propriedades (R(S,S)=90%, intervalo=S em 90%, estabilidade cresce com acertos e cai com erro). Para afirmar equivalência numérica, comparar com a implementação de referência.

## O que ainda NÃO existe
- Revisão por especialista das regras e das fontes.
- Otimização dos parâmetros do FSRS com o histórico do aluno.
- Experimentos controlados (A/B) e medição de aprendizagem (pré/pós-teste, retenção após intervalo).
- IA de linguagem consultando a base de evidência (apenas para explicar/adaptar a linguagem, com saída validada pelas regras).
- Coleta de dados na nuvem com consentimento (hoje tudo fica no aparelho).

## Roadmap de fidelidade
1. **Revisão especializada** da base (pedagogo/psicólogo da educação) e fechamento das referências (`verified: true`).
2. **Servidor com consentimento** (Supabase): dados agregados e anonimizados para avaliar as regras.
3. **Pilotos** com Ensino Médio e Superior, com métricas de aprendizagem válidas (doc 12 §14).
4. **Otimização do FSRS** por usuário quando houver revisões suficientes.
5. **IA de linguagem com consulta ao acervo curado**, sempre dentro das regras, com fallback sem IA e atenção à LGPD (menores).

## Como incluir novas fontes
1. Adicionar a referência em `SOURCES` (`verified: false`).
2. Ligar à técnica em `EVIDENCE[...].sourceIds` e ajustar `strength`, `summary` e `caveat`.
3. Se mudar a recomendação, atualizar a regra em `recommendation.ts` e os testes.
4. Após revisão humana, marcar `verified: true` / `review: 'revisada'`.
