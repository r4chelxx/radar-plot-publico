# Radar 1.0 — continuação das correções de 23/10/2026

## Escopo

Lote consolidado no PR #38. Incorporar o conteúdo atual da main, incluindo a correção da ANA e as quatro ferramentas do PR #37, a Vital Impacts e os ajustes da publicação diária. Preservar a remoção da duplicata do Open Notebook e a ressalva de horário da Equality Fund já preparadas no PR.

## Metadados das bases

Os 12 avisos estruturais correspondiam a seis registros. Foram acrescentadas limitações aos portais Transparência Salvador, Transparência Bahia e ANEEL; referências, limitações e data de revisão aos pontos de pesquisa ANEEL/MME, CBF e APEB. Isso completa os campos, sem transformar uma referência institucional em base consolidada ou afirmar que todas as páginas estão acessíveis.

- Transparência Salvador: https://transparencia.salvador.ba.gov.br/ — tentativa de leitura não concluída. Mantida a data anterior de verificação; a limitação registra a tentativa inconclusiva de 23/10.
- Transparência Bahia: https://www.transparencia.ba.gov.br/Portal e https://www.transparencia.ba.gov.br/Faq — acesso direto inconclusivo nesta rodada. Mantida a data anterior; não afirmar atualização uniforme dos módulos.
- ANEEL Dados Abertos: https://dadosabertos.aneel.gov.br/ — página consultada; catálogo com recursos distintos e etiqueta de descontinuação. Acrescentada orientação de leitura dos metadados por recurso.
- ANEEL: https://www.gov.br/aneel/pt-br/centrais-de-conteudos/biblioteca — orienta a busca de legislação. MME: https://www.gov.br/mme/pt-br/acesso-a-informacao/legislacao — índice por tipo de ato. As referências não confirmam atos de um data center específico.
- CBF: https://www.cbf.com.br/selecao-brasileira/noticias/selecao-feminina-principal/a/arthur-elias-apresenta-convocadas-para-amistosos-contra-eua-e-periodo-de-preparacao — publicação oficial localizada em busca; leitura direta retornou 502. Data de revisão refere-se à localização da referência, com essa restrição explícita no registro; listas e completude histórica não foram validadas.
- APEB: https://www.ba.gov.br/fpc/arquivo-publico-acervo — descrição do acervo e orientação para inventários, AtoM e SICRO consultadas. Não foi confirmado fundo ou série específico de aforamentos. Nome do registro ajustado para não sugerir uma coleção já identificada.

## Nova amostra de acessibilidade

Requisições GET nesta sessão, com limite de oito segundos. Diagnóstico amostral: não substitui a auditoria completa nem modifica suas classificações publicadas.

| Fonte | Resultado nesta sessão |
| --- | --- |
| Portal de Dados Abertos do SUS | HTTP 503 |
| SEI-BA / ArcGIS REST | Tempo esgotado |
| Transparência Bahia | Tempo esgotado |
| CBF | HTTP 503 |
| Kiplinger | HTTP 503 |
| CNT | HTTP 200 |
| Portal Dados Abertos Bahia | HTTP 503 |
| SEFAZ Salvador | Tempo esgotado |

A CNT respondeu nesta amostra, apesar da falha de rede anterior. Os demais resultados não demonstram remoção do conteúdo; manter os registros e a revisão pendente. Não desabilitar validação de certificados nem trocar URLs com base somente em erro de rede.

## Validação local do lote

35 testes de unidade aprovados; validação com 103 oportunidades, 153 registros de dados, 187 fontes e 66 ferramentas, zero erros e zero avisos de campos obrigatórios. Interface estática e sete verificações dos controles de publicação aprovadas. O resultado estrutural não elimina as ressalvas de acesso e de completude registradas acima.

## Pendência reencontrada: ANA/SNIRH

A inspeção do histórico mostrou que o commit `251c425` (PR #44), posterior ao PR #37, voltou a usar `https://www.snirh.gov.br/arcgis/rest/services/SRE/OutorgasDireitodeUso/FeatureServer/0` nos campos `url` e `api`, mas manteve a referência alternativa em `discoveryUrl`. Essa divergência também está na main atual e foi preservada na sincronização deste lote.

Na consulta direta desta sessão, tanto esse endereço quanto `https://portal1.snirh.gov.br/arcgis/rest/services/SRE/OutorgasFederais_FeatureLayer/FeatureServer/0`, com `?f=pjson`, retornaram HTTP 200 com objeto `error`, código 404 e mensagem `Service not found`. A busca web ainda consegue recuperar metadados do primeiro endereço em conteúdo previamente indexado; isso não confirma a disponibilidade atual do serviço.

Não substituir um endereço pelo outro nesta rodada sem uma resposta válida de camada e de consulta. A auditoria de links atual só interpreta o status HTTP, portanto um HTTP 200 contendo erro de ArcGIS também precisa ser tratado em lote posterior. Nenhum resultado JSON com erro deve ser anunciado como serviço confirmado.

O PR permanece em rascunho. Confirmar os checks remotos e resolver a pendência do serviço da ANA antes da integração. Dados, navegador e coleta da revisão `7921b87` passaram no GitHub; a auditoria completa de links ainda estava em andamento no momento desta nota.
