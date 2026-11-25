# 04 — Motor de automação

O motor transforma **entradas** (disciplinas, prazos, disponibilidade, perfil, histórico) em um **plano semanal de blocos** e em **agenda de revisões**. Roda localmente (offline) e é determinístico/testável.

## Entradas
- `Perfil`: nível, duração de foco/pausa, carga diária máxima, técnicas ativas (`02`).
- `Disciplina`: peso (1–5), dificuldade (1–5), tópicos com status.
- `Prazo`: tipo (prova/entrega/simulado/marco), data, disciplina.
- `Disponibilidade`: janelas por dia da semana (início, fim).
- `Histórico`: sessões realizadas, taxa de acerto, blocos perdidos.

## Saídas
- `BlocoPlano` (data, hora, duração, disciplina, tópico, tipo: estudo | revisão | simulado | escrita | leitura, técnica).
- `Revisao` agendada por cartão/tópico.
- Avisos (sobrecarga, prazo sem cobertura).

## Passo 1 — Pontuação de prioridade
Para cada disciplina `d` na semana:

```
dias_ate_prazo = max(1, dias até o próximo prazo de d)
urgencia  = 1 / dias_ate_prazo          (normalizada 0–1 entre as disciplinas)
prioridade(d) = 0.4*peso + 0.3*dificuldade + 0.3*urgencia*5   (escala 1–5)
              + bonus_defasagem (até +1 se tópicos "não vistos" > 50%)
```
Horas semanais da disciplina = `horas_disponiveis * prioridade(d) / Σ prioridade`, respeitando mínimo de 1 bloco por disciplina ativa.

## Passo 2 — Fatiamento em blocos
- Duração do bloco = foco do perfil (ex.: 20, 25, 50, 90 min). Horas viram `n = round(horas*60/foco)` blocos.
- Tipo do bloco por proximidade da prova: > 14 dias → estudo novo; 14–4 dias → mistura estudo + revisão; ≤ 3 dias → revisão + simulado.
- Tópicos escolhidos: primeiro "estudando", depois "não visto" por ordem do conteúdo.

## Passo 3 — Alocação nas janelas (time-blocking)
1. Reservar blocos fixos: revisões vencidas (prioridade máxima), marcos de projeto, metas de escrita.
2. Ordenar blocos restantes por prioridade; preencher janelas do dia **intercalando disciplinas** (nunca 2 blocos seguidos da mesma disciplina, salvo deep work/pós).
3. Limite de carga diária do perfil; inserir pausa conforme técnica (Pomodoro: pausa longa a cada 4 ciclos).
4. Dias de descanso: ≥ 1 dia/semana com carga reduzida (Fund. II: 2).
5. Se faltar tempo: emitir aviso "prazo X sem cobertura" e sugerir ampliar janelas.

## Passo 4 — Revisões espaçadas
- Ao concluir tópico: agendar revisões em D+1, D+7, D+30 (padrão) — ou, por cartão, intervalo pelo SM-2 (MVP) / FSRS (v1+).
- Teto diário de revisões por perfil (ex.: Fund. II 15, Médio 40, Superior 50, Pós 40); excedente rola para o dia seguinte por ordem de atraso.
- Resultado da revisão (errou/difícil/bom/fácil) ajusta intervalo e dificuldade do tópico.

## Passo 5 — Replanejamento
Gatilhos: bloco perdido/adiado, novo prazo, mudança de disponibilidade, fim do dia.
- Blocos perdidos: realocar nos próximos slots livres antes do prazo; se não couber, reduzir blocos de menor prioridade e avisar.
- Nunca mover blocos "travados" manualmente (REQ-008).
- Reexecutar apenas horizonte de 14 dias para ser rápido (< 2 s).

## Passo 6 — Projetos longos
Marcos (`05`) geram blocos `escrita`/`leitura` com meta diária; entram como blocos fixos no Passo 3. Desvio acumulado > 15% dispara alerta de risco.

## Passo 7 — Aprendizado do histórico (v1)
Ajusta foco ideal (horário em que o aluno cumpre mais blocos), duração efetiva e dificuldade percebida.

## Exemplo numérico
Aluno do Médio, 10 h/semana, foco 25 min:
| Disciplina | Peso | Dif. | Prazo | Prioridade |
|---|---|---|---|---|
| Matemática | 5 | 4 | prova em 5 d | ~4,6 |
| História | 3 | 2 | prova em 20 d | ~2,6 |
| Química | 4 | 5 | sem prazo | ~3,9 |
Horas: Mat ≈ 4,4 h (≈ 10 blocos), Qui ≈ 3,7 h (≈ 9), His ≈ 2,5 h (≈ 6). Matemática com prova em 5 dias recebe blocos de revisão + simulado; intercalada com Química e História nas janelas.

## Casos de borda
- Sem disponibilidade informada → perguntar; oferecer janelas padrão do perfil.
- Muitos prazos no mesmo dia → alertar conflito, sugerir priorização (Eisenhower).
- Usuário inativo > 7 dias → plano "retomada" com carga 50%.
- Fuso/horário de verão → armazenar em UTC, exibir local.
- Revisões atrasadas > teto → modo "recuperação" (limite diário + descartar duplicadas).

## Testes
Cobertura obrigatória: distribuição de horas, intercalação, respeito de janelas/limites, replanejamento, SM-2, marcos reversos. Implementar como módulo puro TypeScript (sem dependência de UI) com testes de propriedade.
