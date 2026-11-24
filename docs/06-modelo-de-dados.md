# 06 — Modelo de dados

IDs UUID; datas em UTC; `updated_at` e `deleted_at` (soft delete) em todas as tabelas para sincronização.

## Entidades

| ID | Entidade | Campos principais |
|----|----------|-------------------|
| ENT-01 | **Usuario** | id, nome, email, nascimento, nivel (`fund2`/`medio`/`superior`/`pos`), idioma, fuso |
| ENT-02 | **Perfil** | usuario_id, foco_min, pausa_min, pausa_longa_min, carga_diaria_min, tecnicas_ativas[], gamificacao (`alta/media/baixa/minima`), teto_revisoes |
| ENT-03 | **Responsavel** | id, email, vinculo_usuario_id, consentimento_em, status |
| ENT-04 | **Disciplina** | id, usuario_id, nome, cor, peso, dificuldade, periodo (ano/semestre), ativa |
| ENT-05 | **Topico** | id, disciplina_id, parent_id, titulo, ordem, status (`nao_visto/estudando/dominado`), dificuldade_percebida |
| ENT-06 | **Prazo** | id, disciplina_id, tipo (`prova/entrega/simulado/marco`), data, peso_nota, projeto_marco_id? |
| ENT-07 | **Disponibilidade** | usuario_id, dia_semana, inicio, fim |
| ENT-08 | **BlocoPlano** | id, usuario_id, inicio, duracao_min, tipo, disciplina_id?, topico_id?, projeto_marco_id?, tecnica, status (`planejado/feito/perdido/adiado`), travado |
| ENT-09 | **SessaoEstudo** | id, bloco_id?, inicio, fim, duracao_real_min, foco_ciclos, nota_autoavaliacao |
| ENT-10 | **Deck** | id, disciplina_id?, topico_id?, nome |
| ENT-11 | **Cartao** | id, deck_id, tipo, frente, verso, intervalo_dias, facilidade, estabilidade?, proxima_revisao |
| ENT-12 | **Revisao** | id, cartao_id ou topico_id, data, resultado (`errou/dificil/bom/facil`) |
| ENT-13 | **Simulado** | id, disciplina_id?, data, duracao_min, total_questoes |
| ENT-14 | **QuestaoResposta** | simulado_id, topico_id, acertou, tempo_s |
| ENT-15 | **Nota** | id, topico_id?, tipo (`cornell/feynman/livre/mapa`), conteudo (JSON), privada |
| ENT-16 | **Projeto** | id, usuario_id, modelo (`tcc/dissertacao/tese/artigo`), titulo, data_final, horas_semana, meta_diaria, unidade_meta |
| ENT-17 | **Marco** | id, projeto_id, titulo, data_alvo, esforco_h, status, ordem, depende_de_id? |
| ENT-18 | **Subtarefa** | id, marco_id, titulo, concluida |
| ENT-19 | **Referencia** | id, projeto_id, tipo, autores, titulo, ano, doi, bibtex, marco_id? |
| ENT-20 | **Fichamento** | id, referencia_id, citacao, resumo, metodo, resultados, relevancia |
| ENT-21 | **ReuniaoOrientador** | id, projeto_id, data, resumo, tarefas_geradas[] |
| ENT-22 | **RegistroEscrita** | id, projeto_id, data, quantidade, unidade |
| ENT-23 | **Conquista/Progresso** | usuario_id, xp, sequencia_atual, maior_sequencia, conquistas[] |

## Relacionamentos (resumo)
```
Usuario 1─1 Perfil          Usuario 1─N Disciplina 1─N Topico (árvore)
Usuario 1─N Disponibilidade Disciplina 1─N Prazo
Usuario 1─N BlocoPlano N─1 (Disciplina|Topico|Marco)   BlocoPlano 1─N SessaoEstudo
Disciplina/Topico 1─N Deck 1─N Cartao 1─N Revisao
Usuario 1─N Projeto 1─N Marco 1─N Subtarefa ; Projeto 1─N Referencia 1─N Fichamento
Projeto 1─N ReuniaoOrientador ; Projeto 1─N RegistroEscrita
Usuario N─N Responsavel (apenas Fund. II)
```

## Regras de integridade
- `Topico.parent_id` sem ciclos; profundidade máx. 4.
- `BlocoPlano.travado=true` não é movido pelo motor.
- Notas `privada=true` nunca aparecem ao Responsavel.
- Soft delete propaga a filhos (deck→cartões, projeto→marcos).
- Conflitos de sync: **last-write-wins por campo** com `updated_at`; revisões são *append-only* (sem conflito).
