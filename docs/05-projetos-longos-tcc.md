# 05 — Projetos longos (TCC, dissertação, tese, artigo)

Disponível principalmente para **Superior** e **Pós-graduação** (pode ser ativado no Médio para trabalhos extensos). Requisitos: REQ-020 a REQ-025.

## Modelos de projeto
| Modelo | Duração típica | Estrutura de marcos (template) |
|---|---|---|
| TCC (graduação) | 6–12 meses | Tema e orientador → Projeto/proposta → Revisão da literatura → Metodologia → Coleta/desenvolvimento → Análise/resultados → Escrita final → Revisão do orientador → Formatação ABNT → Entrega → Banca |
| Dissertação (mestrado) | 18–24 meses | Disciplinas → Projeto → Qualificação → Revisão sistemática → Coleta → Análise → Capítulos → Revisão → Depósito → Defesa |
| Tese (doutorado) | 36–48 meses | Idem + artigos publicados, qualificação, capítulos longos |
| Artigo científico | 2–6 meses | Pergunta → Literatura → Método → Resultados → Rascunho → Revisão de coautores → Submissão → Revisões do periódico |

Cada marco tem: título, data-alvo, estimativa de esforço (h), status, subtarefas, dependências.

## Engenharia reversa a partir da entrega
1. Usuário informa **data final** (defesa/entrega) e horas semanais disponíveis.
2. O app distribui os marcos para trás, proporcionalmente ao esforço do template, com **folga ≥ 10%** antes da data final e buffer extra para revisão do orientador (ex.: 2–3 semanas).
3. Se `esforço total > horas disponíveis até a data`, avisa e propõe: ampliar horas, reduzir escopo ou adiar marco.

## Metas de escrita e leitura
- Meta diária: palavras ou páginas (escrita), páginas/artigos (leitura) — derivada do esforço restante / dias úteis restantes.
- Viram blocos `escrita`/`leitura` no motor (`04`, Passo 6) com deep work (TEC-06).
- Registro de progresso diário (contagem de palavras informada ou importada manualmente).
- Sequência de escrita (streak) opcional.

## Gestor de referências e fichamentos
- Cadastro: manual, DOI/ISBN (v1+), BibTeX importado.
- Fichamento estruturado: citação, resumo, método, resultados, relevância, capítulo associado.
- Exportação de referências em **ABNT** (NBR 6023) e APA; citações NBR 10520.
- Vínculo referência ↔ marco/capítulo.

## Checklist de normas e formatação
Estrutura pré-textual/textual/pós-textual (ABNT NBR 14724), margens, fonte, espaçamento, resumo/abstract, ficha catalográfica (quando exigida). Checklist editável conforme a instituição.

## Orientador e bancas
- Registro de reuniões (data, decisões, tarefas geradas → viram subtarefas).
- Versões entregues e feedback recebido por capítulo.
- Contagem regressiva para qualificação/defesa.

## Alerta de risco
Risco = `% esforço previsto até hoje − % concluído`. Faixas: verde < 10%, amarelo 10–25%, vermelho > 25%. Ao entrar em amarelo/vermelho, o app sugere replanejar (realocar blocos, ampliar janelas, renegociar prazo).

## Fora de escopo (v1)
Editor completo de documento; detecção de plágio; integração com repositórios institucionais.
