# ESTUDA+ --- Arquitetura funcional

**Versão:** 1.0\
**Data:** novembro de 2026\
**Decisões de produto:** aplicação assistida das técnicas; público
amplo, de diferentes idades e níveis educacionais.

------------------------------------------------------------------------

## 1. Visão do produto

O ESTUDA+ é um aplicativo mobile first de planejamento e acompanhamento
da aprendizagem. O sistema recomenda técnicas de estudo, organiza
conteúdos e tempo, orienta a execução das sessões e adapta o plano com
base no retorno do estudante.

### Decisões fundamentais

1.  **Modelo assistido:** o sistema recomenda, explica e prepara a
    atividade; o aluno pode aceitar, trocar a técnica ou personalizar a
    sessão.
2.  **Público amplo:** um núcleo funcional comum, com experiências
    adaptadas por faixa de desenvolvimento, etapa educacional e
    objetivo.
3.  **Automação sem dependência inicial de IA:** regras transparentes e
    algoritmos determinísticos no MVP. IA pode ser adicionada depois,
    como recurso opcional.
4.  **Planejamento editável:** o aluno mantém controle sobre horários,
    duração, prioridades e técnicas.
5.  **Aprendizagem acima de tempo de tela:** minutos estudados são
    métricas de rotina, não prova de aprendizagem.

## 2. Princípios de arquitetura

-   Mobile first, com interface responsiva e possibilidade de PWA.
-   Modularidade: perfil, conteúdos, técnicas, planejamento, sessões e
    acompanhamento separados.
-   Personalização por contexto, não apenas pela idade.
-   Explicabilidade: mostrar por que uma técnica ou tarefa foi
    recomendada.
-   Acessibilidade: texto legível, navegação simples, contraste,
    leitores de tela e ajustes de tempo.
-   Privacidade desde a concepção, com atenção especial a crianças e
    adolescentes.
-   Possibilidade de expandir para escola, graduação, concursos e
    pesquisa sem reconstruir o núcleo.

## 3. Perfis e modos de uso

A idade é uma referência de experiência, não uma regra rígida. O
estudante pode ter autonomia, necessidades e ritmo diferentes de outros
da mesma faixa etária.

  -----------------------------------------------------------------------
  Modo                    Público de referência   Adaptação
  ----------------------- ----------------------- -----------------------
  Infantil                Crianças em idade       Atividades curtas,
                          pré-escolar e primeiros visuais, linguagem
                          anos                    simples e participação
                                                  de responsável

  Fundamental             Ensino fundamental      Orientações passo a
                                                  passo, sessões curtas e
                                                  autonomia progressiva

  Ensino médio            Adolescentes            Disciplinas, provas,
                                                  exercícios, revisões e
                                                  planejamento semanal

  Superior                Graduação               Disciplinas, leituras,
                                                  projetos, avaliações e
                                                  gestão de prazos

  Pesquisa                TCC, especialização,    Etapas, entregáveis,
                          mestrado e doutorado    leitura, fichamento,
                                                  escrita e revisão

  Objetivo livre          Concursos,              Trilhas e conteúdos
                          certificações, idiomas  configuráveis
                          e aprendizagem pessoal  
  -----------------------------------------------------------------------

### Dados de perfil

-   faixa etária ou data de nascimento, quando estritamente necessária;
-   etapa educacional;
-   objetivo principal;
-   nível de autonomia;
-   preferências de acessibilidade;
-   disponibilidade semanal;
-   disciplinas, áreas ou projetos;
-   preferência de duração das sessões.

Para menores, prever fluxo de responsável, consentimento e controles
adequados. Coletar o mínimo de dados pessoais necessário.

## 4. Jornada principal do estudante

1.  Criar conta ou entrar.
2.  Escolher o modo de uso ou etapa educacional.
3.  Informar o objetivo: estudar regularmente, preparar prova, concurso,
    idioma, disciplina, TCC, dissertação ou tese.
4.  Cadastrar disciplinas, conteúdos ou etapas de projeto.
5.  Informar prazo, disponibilidade e prioridades.
6.  Receber um plano inicial.
7.  Conferir as recomendações de técnica e aceitar ou trocar.
8.  Executar a sessão guiada.
9.  Registrar percepção de dificuldade, confiança e resultado.
10. Receber revisões e ajustes no plano.

A jornada deve permitir começar com poucos dados. Informações adicionais
podem ser solicitadas conforme se tornem necessárias.

## 5. Módulos funcionais

### 5.1 Perfil e diagnóstico

Responsabilidades: - registrar etapa educacional, objetivo e
preferências; - identificar disponibilidade e autonomia; - permitir
atualização do perfil; - ativar a experiência adequada.

Saída: contexto de personalização para os demais módulos.

### 5.2 Objetivos, disciplinas e conteúdos

Hierarquia sugerida:

`Objetivo → Disciplina/Área → Unidade → Conteúdo/Tópico → Tarefa`

Exemplo: - Objetivo: preparar-se para avaliação. - Disciplina:
Biologia. - Unidade: Genética. - Conteúdo: leis de Mendel. - Tarefa:
estudar conceitos, responder perguntas e resolver exercícios.

Para pesquisa: `Projeto → Etapa → Entregável → Tarefa`

Exemplo: - Projeto: dissertação. - Etapa: revisão de literatura. -
Entregável: síntese temática. - Tarefa: localizar artigos, ler, fichar e
redigir síntese.

As estruturas devem ser editáveis. Um TCC ou uma tese não deve ter
etapas institucionais rígidas impostas pelo aplicativo.

### 5.3 Biblioteca de técnicas

Cada técnica deve ter: - nome e descrição; - objetivo pedagógico; - tipo
de atividade indicado; - contexto e limitações; - faixa de
desenvolvimento sugerida; - etapas de execução; - duração
configurável; - materiais necessários; - forma de verificar a
atividade; - alternativas acessíveis; - regras de revisão, quando
aplicável.

Técnicas iniciais: 1. Recuperação ativa (Active Recall). 2. Repetição
espaçada. 3. Pomodoro/blocos de foco. 4. Feynman. 5. Prática de
exercícios e simulados. 6. Prática intercalada. 7. Elaboração. 8.
Autoexplicação. 9. Mapas mentais e conceituais. 10. Método Cornell. 11.
Leitura ativa. 12. Fichamento. 13. Brain Dump. 14. Dupla codificação.
15. Estudo baseado em problemas.

Nem toda técnica precisa de uma ferramenta visual exclusiva. O sistema
pode reutilizar componentes como temporizador, perguntas, editor de
texto, cartões, formulário e registro de respostas.

### 5.4 Motor de recomendação

Entradas: - objetivo do estudante; - etapa educacional e autonomia; -
tipo de conteúdo/tarefa; - dificuldade e domínio autodeclarados; - tempo
disponível; - técnicas já utilizadas; - desempenho anterior e
preferência do aluno.

Saídas: - técnica principal sugerida; - técnica complementar, quando
útil; - justificativa da recomendação; - duração inicial sugerida; -
passos da sessão; - atividade de verificação; - indicação de revisão.

Exemplos de regras iniciais:

  Contexto                       Recomendação inicial
  ------------------------------ ------------------------------------------------
  Memorizar conceitos            Recuperação ativa + repetição espaçada
  Resolver problemas             Exercícios + autoexplicação + análise de erros
  Compreender assunto complexo   Elaboração + Feynman
  Preparar prova                 Recuperação ativa + questões + revisões
  Ler artigo científico          Leitura ativa + fichamento
  Escrever capítulo              Blocos de escrita + revisão
  Aprender idioma                Recuperação ativa + prática distribuída
  Organizar conteúdo de aula     Cornell ou mapa conceitual

O sistema deve permitir troca manual. A recomendação nunca deve ser uma
imposição nem se basear em estilos fixos de aprendizagem.

### 5.5 Planejador automático

Entradas: - prazo; - tempo disponível por dia/semana; - quantidade de
conteúdos; - prioridade; - dificuldade; - domínio; - necessidade de
prática e revisão.

Processamento: 1. calcular capacidade de estudo disponível; 2. estimar
carga total de tarefas; 3. reservar espaço para prática e revisão; 4.
distribuir conteúdos respeitando prioridades; 5. evitar sobrecarga
diária; 6. sinalizar quando o objetivo não cabe no tempo disponível; 7.
gerar plano editável.

Se o estudante não cumprir uma sessão: - perguntar se deseja
redistribuir; - preservar tarefas prioritárias; - recalcular os próximos
dias; - mostrar o impacto no prazo; - não acumular automaticamente todas
as tarefas no dia seguinte.

### 5.6 Executor de sessões

Cada sessão apresenta: - objetivo da atividade; - conteúdo; - técnica
escolhida; - duração e etapas; - instruções simples; - temporizador,
quando aplicável; - recurso para pausar, encerrar ou trocar a técnica; -
registro final.

Exemplo de sessão: 1. 5 min --- recuperação do conteúdo anterior; 2. 20
min --- leitura ou estudo guiado; 3. 5 min --- pausa; 4. 15 min ---
exercícios; 5. 5 min --- correção e reflexão.

A divisão é configurável e não deve ser tratada como prescrição
universal.

### 5.7 Revisão inteligente

-   criar revisão após estudo inicial;
-   apresentar perguntas, cartões ou exercícios;
-   registrar acertos, erros e confiança;
-   adaptar o próximo intervalo;
-   permitir reagendamento;
-   exibir revisões pendentes.

Começar com intervalos configuráveis e regras simples. Evoluir para
adaptação baseada no histórico, validando o algoritmo antes de fazer
afirmações sobre retenção.

### 5.8 Acompanhamento e relatórios

Indicadores: - sessões planejadas e realizadas; - tempo de estudo por
disciplina; - conteúdos estudados; - revisões realizadas e pendentes; -
desempenho em atividades; - dificuldade autodeclarada; - entregáveis
concluídos; - consistência semanal.

Diferenciar claramente: - **atividade:** o estudante realizou uma
sessão; - **desempenho:** resultado em perguntas/exercícios; -
**percepção:** confiança ou dificuldade declarada; - **progresso:**
tarefas e entregáveis concluídos.

## 6. Modelo de aplicação assistida

A experiência deve apresentar três opções após a recomendação:

-   **Usar recomendação:** aceitar técnica e sessão propostas.
-   **Trocar técnica:** selecionar outra técnica compatível.
-   **Personalizar:** alterar duração, sequência ou número de etapas.

Exemplo: O aluno cadastra "Equações do segundo grau". O sistema sugere
exercícios com autoexplicação. O aluno pode aceitar, trocar para Feynman
ou ajustar o tempo. A escolha e o resultado são registrados para
melhorar recomendações futuras.

A preferência do aluno é um dado importante, mas não deve ser confundida
com evidência de eficácia. O sistema pode sugerir experimentar outra
abordagem se a atual não estiver ajudando.

## 7. Automações e gatilhos

  Evento                      Ação automática
  --------------------------- ----------------------------------------------
  Novo objetivo               Sugerir estrutura de disciplinas e conteúdos
  Prazo informado             Calcular capacidade e gerar plano
  Técnica aceita              Preparar sessão orientada
  Sessão concluída            Atualizar progresso e histórico
  Conteúdo estudado           Programar revisão
  Resultado baixo             Sugerir prática adicional ou revisão
  Sessão perdida              Oferecer replanejamento
  Prazo próximo               Alertar sobre tarefas e carga
  Semana encerrada            Gerar resumo e propor ajustes
  Etapa acadêmica concluída   Sugerir próximo entregável

Notificações configuráveis, com limite de frequência e possibilidade de
desativação.

## 8. Arquitetura de telas

### Navegação principal

1.  Início.
2.  Meu plano.
3.  Conteúdos/Projetos.
4.  Técnicas.
5.  Progresso.
6.  Perfil e configurações.

### Telas do MVP

-   Boas-vindas e autenticação.
-   Configuração do perfil.
-   Cadastro de objetivo.
-   Cadastro de disciplinas e conteúdos.
-   Disponibilidade e prazo.
-   Plano semanal.
-   Detalhe da sessão e recomendação.
-   Execução com temporizador.
-   Avaliação pós-sessão.
-   Revisões.
-   Progresso.

### Regras de experiência

-   priorizar uma ação principal por tela;
-   reduzir formulários longos;
-   permitir salvar parcialmente;
-   usar linguagem adequada ao modo;
-   oferecer controles acessíveis;
-   não usar gamificação punitiva;
-   disponibilizar saída e edição simples.

## 9. Arquitetura técnica sugerida

### Primeira versão econômica

-   **Frontend:** aplicação web responsiva com abordagem mobile first.
-   **Distribuição:** PWA instalável; avaliar lojas e app nativo após
    validação.
-   **Backend e banco:** Supabase (Auth, PostgreSQL e Storage, se
    necessário).
-   **Lógica:** serviços de planejamento e recomendação implementados
    por regras.
-   **Notificações:** começar com lembretes internos e notificações
    compatíveis com PWA.
-   **IA:** não necessária para o MVP.

### Camadas lógicas

1.  Apresentação: telas e componentes.
2.  Aplicação: casos de uso e fluxos.
3.  Domínio: regras de recomendação, planejamento e revisão.
4.  Dados: persistência, autenticação e permissões.
5.  Serviços: notificações, exportações e integrações futuras.

Manter regras de domínio separadas da interface para que uma futura
versão nativa possa reutilizar a lógica.

## 10. Modelo inicial de dados

  Entidade            Finalidade
  ------------------- ------------------------------------------
  `users`             Identidade e autenticação
  `profiles`          Etapa, preferências e configurações
  `guardians`         Relação de responsável, quando aplicável
  `goals`             Objetivos, prazos e prioridades
  `subjects`          Disciplinas e áreas
  `topics`            Unidades e conteúdos
  `projects`          TCC, dissertação, tese e outros projetos
  `project_tasks`     Etapas, tarefas e entregáveis
  `techniques`        Catálogo de técnicas
  `technique_rules`   Regras de indicação e compatibilidade
  `study_plans`       Planos e versões
  `study_sessions`    Sessões planejadas e executadas
  `session_steps`     Etapas internas da sessão
  `reviews`           Revisões agendadas e realizadas
  `assessments`       Resultados e autoavaliação
  `notifications`     Lembretes e preferências

Todas as tabelas com dados pessoais devem ter regras de acesso por
usuário e, quando necessário, por responsável autorizado. Implementar
Row Level Security no Supabase e testar permissões.

## 11. Escopo recomendado do MVP

### Incluir

-   autenticação;
-   perfil e objetivo;
-   cadastro de disciplinas/conteúdos;
-   disponibilidade e prazo;
-   planejador baseado em regras;
-   biblioteca inicial com 4 técnicas;
-   recomendação assistida com opção de troca;
-   executor de sessões;
-   temporizador;
-   avaliação pós-sessão;
-   revisão programada;
-   painel básico.

### Técnicas do MVP

1.  Pomodoro/blocos de foco.
2.  Recuperação ativa.
3.  Repetição espaçada.
4.  Prática de exercícios.

Essas quatro permitem validar planejamento, execução e acompanhamento
sem criar ferramentas complexas para cada método.

### Não incluir inicialmente

-   geração de questões por IA;
-   leitura e interpretação automática de PDFs;
-   editor avançado de mapas mentais;
-   rede social ou estudo em grupo;
-   painel institucional;
-   integração com plataformas escolares;
-   algoritmo de recomendação baseado em aprendizado de máquina.

## 12. Evolução por fases

  -----------------------------------------------------------------------
  Fase                                Entregas
  ----------------------------------- -----------------------------------
  0 --- Descoberta                    Entrevistas, definição de público
                                      piloto e protótipo

  1 --- MVP                           Perfil, conteúdos, plano, 4
                                      técnicas, sessões e revisões

  2 --- Ampliação                     Feynman, Cornell, leitura ativa,
                                      mapas e fichamento

  3 --- Projetos                      Modo TCC/dissertação/tese e gestão
                                      de entregáveis

  4 --- Personalização                Recomendação adaptativa e
                                      relatórios mais completos

  5 --- Expansão                      Responsáveis, educadores,
                                      instituições e integrações
  -----------------------------------------------------------------------

Embora o produto tenha público amplo como visão, o piloto deve testar
primeiro dois grupos com necessidades diferentes, por exemplo ensino
médio e graduação. O modo infantil deve ser validado separadamente, com
responsáveis e especialistas.

## 13. Critérios de aceite do MVP

O MVP será considerado funcional quando:

-   o usuário consegue criar perfil e objetivo;
-   consegue cadastrar conteúdos e disponibilidade;
-   recebe um plano que respeita os limites de tempo configurados;
-   entende por que uma técnica foi sugerida;
-   consegue aceitar, trocar ou personalizar a técnica;
-   consegue executar e concluir uma sessão;
-   o sistema registra resultado e atualiza progresso;
-   uma revisão é programada após o estudo;
-   uma sessão perdida pode ser replanejada;
-   usuários não conseguem acessar dados uns dos outros;
-   a experiência funciona em telas móveis comuns.

## 14. Indicadores de validação

-   taxa de conclusão do cadastro;
-   taxa de criação do primeiro plano;
-   proporção de recomendações aceitas, trocadas e personalizadas;
-   sessões iniciadas e concluídas;
-   revisões realizadas;
-   retorno em 7 e 30 dias;
-   percepção de organização e utilidade;
-   evolução em atividades, quando mensurada de forma válida.

Não usar apenas tempo de tela ou sequência de dias como evidência de
aprendizagem.

## 15. Cuidados pedagógicos, éticos e legais

-   Não presumir estilos fixos de aprendizagem (visual, auditivo ou
    cinestésico) como fundamento para prescrição.
-   Tratar idade como um dos fatores, não como diagnóstico de
    capacidade.
-   Adaptar linguagem, autonomia e duração sem impor limites
    inflexíveis.
-   Não prometer resultados ou retenção garantida.
-   Permitir pausas, ajustes e desligamento de notificações.
-   Aplicar princípios da LGPD e proteção reforçada para crianças e
    adolescentes.
-   Planejar consentimento e participação de responsáveis quando
    exigidos.
-   Não substituir professor, orientador ou avaliação profissional.
-   Evitar mecanismos de pressão, punição e comparação pública.

## 16. Próximas entregas de desenvolvimento

A sequência recomendada para transformar esta arquitetura em produto é:

1.  Especificação detalhada do MVP.
2.  Fluxo de navegação e wireframes das telas.
3.  Dicionário de dados e relacionamentos do banco.
4.  Regras formais do motor de recomendação.
5.  Regras do planejador e reagendamento.
6.  Prompt de implementação para Lovable.
7.  Plano de testes com estudantes dos grupos piloto.

**Decisão final recomendada:** lançar primeiro como PWA mobile first,
com aplicação assistida, regras transparentes e quatro técnicas no MVP.
Manter o modelo de dados preparado para os demais níveis, mas validar a
experiência com grupos piloto antes de expandir para todas as idades.
