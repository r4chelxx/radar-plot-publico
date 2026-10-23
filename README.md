# Radar PLOT — consulta pública

Oportunidades, bases de dados, ferramentas e calendário podem ser consultados sem
cadastro. Pautas, mapas, vínculos, notas e decisões pessoais são carregados apenas
para a conta autenticada, com políticas de acesso por proprietário no Supabase.

Este código inicia um histórico público limpo. A implantação em um novo endereço
exige revisar a URL de retorno autorizada no Supabase, criar a branch `radar-state`
a partir deste histórico limpo e conferir os fluxos de descoberta e publicação.
Nunca envie o backup privado ou o histórico do repositório anterior a este destino.
## Descoberta e classificação

`data/sources.js` registra canais monitorados (newsletters, organizações e veículos), com cadência de checagem. `data/datasets.js` registra recursos de dados identificáveis: conjunto, portal, catálogo, sistema ou fonte temática. `data/opportunities.js` registra chamadas concretas. Ferramentas de produção, como Datawrapper e React Simple Maps, ficam em `data/tools.js` e aparecem separadamente na Metodologia.

Quando uma chamada ou recurso for de fato encontrado em um canal monitorado, adicione `discoveredVia:["Nome exato da fonte"]` ao item. Para newsletters, registre também `discoveryUrl` com o link da edição quando disponível. O campo é opcional quando a origem da descoberta não está documentada; não deduza a relação pelo nome da organização. Mantenha `rules` (oportunidade) ou `url` (dados) apontando para o item específico e verifique as condições na origem oficial. Uma edição de newsletter pode gerar vários itens de classes diferentes, sem virar ela própria uma base de dados.

## Navegação editorial

A matriz de Pautas × oportunidades está em `#matriz` (menu “Matriz”) e o catálogo de ferramentas em `#ferramentas` (menu “Ferramentas”). Vínculos pessoais confirmados na matriz aparecem também na ficha da pauta quando a sessão está sincronizada.

## Pautas e mapas privados

Pautas, mapas de apuração e suas ligações com oportunidades e bases não fazem parte dos arquivos públicos. Eles são carregados do Supabase somente depois da autenticação e das políticas de acesso por proprietário. O validador público rejeita qualquer campo de ligação editorial reintroduzido nos catálogos versionados.

## Estado pessoal

O carregamento de `editorial_state` é filtrado pelo usuário autenticado. Respostas de uma sessão anterior são descartadas após troca de conta ou saída; controles de escrita aguardam a sincronização. Textos pessoais são escapados ao renderizar.

## Auditoria de links

A auditoria executa uma requisição real, repete falhas transitórias com tempo maior e preserva resultados bloqueados ou de rede como inconclusivos. Respostas 401, 403, 405, 406 e 429 não significam link quebrado. Um 404/410 aparece primeiro como suspeita e só bloqueia a integração se persistir na auditoria seguinte. Registros internos sem URL pública permanecem catalogados, mas não entram no teste nem exibem botão de acesso.

O relatório mais recente fica em `audit/link-audit-latest.json`. A rotina roda em mudanças de links, em pull requests e semanalmente; execuções concorrentes do mesmo ramo são canceladas para evitar disputa na publicação do relatório.


## Auditoria de qualidade — 13/10/2026

A verificação de interface começa com `node scripts/test-ui-static.js`, executado no CI junto à validação editorial. Este teste verifica dependências de scripts, sintaxe, estrutura básica de navegação, viewport, idioma e CSS responsivo. **Não equivale a um teste de navegador.**

Próximas verificações: testes Playwright em viewport móvel e desktop (navegação de páginas e pautas, filtros, autenticação e estado pessoal), teste de acessibilidade por teclado/leitor de tela, revisão de políticas RLS no Supabase e tratamento de erros de sincronização. As credenciais publicáveis do Supabase no cliente são esperadas; a segurança dos dados depende de políticas RLS efetivas, que não podem ser certificadas apenas pelo repositório.

Regra de publicação: validar dados, regressão de interface e links antes do merge. Depois do merge, confirmar o deploy e a leitura pública. Uma falha intermediária não deve ser reportada como falha final sem conferir a execução de recuperação.


## Fila persistente e publicação editorial (23/10/2026)

A coleta diária em `.github/workflows/unified-web-intake.yml` produz uma fila **de candidatos não verificados**. O job agendado grava apenas URLs públicas, títulos e fontes em `intake/editorial-queue.json` na branch `radar-state`, preservando pendências entre execuções. O arquivo não contém dados privados, credenciais, pautas ou e-mails.

A promoção ao catálogo exige um registro em `intake/approved-publications.json` na branch `main`. Cada entrada precisa conter `category` (`opportunities`, `datasets` ou `tools`), `record` com os campos do catálogo, e `review` com `decision: "approved"`, `reviewedBy`, `reviewedAt`, `officialUrl` e evidência factual detalhada em `evidence`. Não basta a descoberta, um HTTP 200 ou uma classificação automática. O publicador rejeita aprovação incompleta, duplicidade, URL insegura e registros sem campos mínimos. Itens já presentes não são republicados.

O workflow `.github/workflows/editorial-publish.yml` verifica diariamente o manifesto aprovado e, havendo novos registros, atualiza catálogo e histórico com a data de Salvador, roda validações de dados, UI, regressão Playwright e auditoria de links, cria PR e tenta squash merge. Se o GitHub impedir a criação/integração por permissões ou proteção de branch, o job falhará sem publicar; revisar as configurações de Actions e os logs. **Não existe aprovação editorial automática de leads**: a etapa de verificação substantiva permanece necessária para evitar chamadas falsas, prazos incorretos ou ferramentas inadequadas.

Testes locais: `node scripts/test-editorial-pipeline.js`. Para uma execução de publicação de teste sem novos registros, `node scripts/publish-approved.js` é idempotente e não modifica os catálogos quando o manifesto está vazio.


### Revisão contínua do acervo histórico (230 links em 23/10/2026)

O workflow `Radar source discovery` carrega `state/lead-history.json` da branch `radar-state` e agora inspeciona diariamente **15 links do acervo persistido** por ordem de última inspeção, em vez de examinar apenas os links recém-descobertos. Os links ainda não inspecionados têm prioridade, de modo que o lote histórico avança sem ser preterido indefinidamente por novas descobertas. Uma inspeção recente só se repete após 30 dias (7 dias para falhas de acesso). A cada execução o histórico registra `lastInspectedAt`, `inspectionCount` e `pageStatus`, preservando decisões editoriais anteriores. A saída inclui contagens de inspeções e pendências. O lote de 15 é configurável por `LEAD_PAGE_LIMIT` (limite 50); não há garantia de acesso a páginas protegidas, conteúdo dinâmico ou links quebrados.

**Importante:** visita técnica de página não é revisão editorial nem publicação. A fila `intake/editorial-review.json` inclui também os links históricos, e as decisões humanas/assistidas verificadas são declaradas em `intake/historical-decisions.json` com URL, estado, responsável, data, motivo e fonte oficial. Os estados aceitos são `in-review`, `approved`, `published`, `duplicate`, `rejected`, `archived` e `blocked`. Uma aprovação só pode ser marcada quando o registro consta do manifesto `intake/approved-publications.json`; a marcação de publicado exige URL presente no catálogo. O publicador de registros aprovados é o workflow `Publish approved editorial records`, separado do coletor. O histórico nunca é promovido automaticamente com base em HTTP 200 ou menção de prazo. A fila e as decisões não devem incluir Gmail, pautas privadas ou dados pessoais.

Teste de regressão: `node --test tests/historical-backlog.test.js`. A verificação de ponta a ponta da publicação ainda exige acompanhar um ciclo real de coleta, persistência, decisão editorial e publicação no site.
