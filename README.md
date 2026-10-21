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
