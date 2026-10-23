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

O PR permanece em rascunho. Confirmar os checks remotos da nova revisão antes da integração; a auditoria da revisão anterior ainda usava a URL antiga da ANA.
