# OSINT Vault — avaliação para o Radar 1.0

Data: 20/11/2026. Endereço: https://theosintvault.io/.

## Alcance e limitação

Foi obtida uma leitura pública da página inicial, que se apresenta como The OSINT Vault, de Nicole Hurey, com atualização declarada em 19/11/2026. A requisição direta subsequente retornou HTTP 403. O bloqueio não foi contornado. A leitura inicial expôs a apresentação das ferramentas próprias e os nomes de fontes editoriais, mas não as linhas da lista dinâmica de ferramentas externas. Não foi possível obter um inventário completo, contar suas entradas, testar cada destino ou verificar duplicidades de toda a lista.

**Esta é uma avaliação parcial do site, não uma auditoria concluída do seu diretório. Nenhuma nova ficha do OSINT Vault foi publicada neste lote.** Para concluir, é necessário um HTML completo salvo com a lista carregada, acompanhado dos arquivos locais em ZIP, ou uma exportação do diretório contendo nomes e URLs. Um HTML que contenha apenas o carregador JavaScript pode não incluir os recursos.

## Adequação editorial do site

O site funciona como diretório de investigação digital e conjunto de utilitários. Merece avaliação como catálogo de descoberta, separado de bases de dados específicas. Sua organização contempla identidade digital, infraestrutura, inteligência de ameaças, registros públicos, empresas, redes sociais, ferramentas de linha de comando e extensões. Essa amplitude é útil para jornalistas, mas reúne aplicações com finalidades e exigências distintas.

A identificação de autora e a data declarada ajudam na rastreabilidade. Termos como “verificado”, “gratuito”, “sem cadastro”, processamento local ou associação entre identidades são declarações da própria página, não resultados de testes desta auditoria. Licença, monetização, limites, funcionamento real e políticas de retenção precisam ser conferidos em cada produto antes de compor uma ficha definitiva.

## Ferramentas próprias identificadas na página inicial

| Recurso | Categoria proposta | Utilidade para jornalistas | Parecer e validação necessária |
|---|---|---|---|
| CLOCKEDF12 | Extensão de inspeção técnica | Examinar redes, APIs, JavaScript e elementos do navegador | Candidata a ferramenta. Confirmar endereço oficial da extensão, permissões, documentação e manutenção. Inspeção apresentada pelo site não comprova capacidade de acessar conteúdo restrito. |
| Omertà | Busca e correlação de identificadores | Investigar nomes, usuários, telefones, domínios e e-mails | Candidata com ressalvas. Correspondências são pistas; não demonstram que perfis pertencem à mesma pessoa. Conferir fontes, falsos positivos e tratamento de dados. |
| OSINT Grid | Catálogo de registros públicos | Localizar fontes dos 50 estados dos EUA, Distrito de Colúmbia e âmbito federal | Candidato a catálogo, não a base única. Cobertura e ausência de cadastro são alegações da página; conferir fontes, jurisdições, custos e restrições individualmente. |
| TELLTALE | Inspeção de texto | Examinar caracteres invisíveis, homóglifos, repetições e inconsistências | Candidata apenas com descrição delimitada. Padrões de escrita não provam autoria, fabricação, intenção ou geração por IA. Validação independente necessária. |
| Multi-Search Launcher | Busca em múltiplas plataformas | Distribuir consultas e organizar pesquisas | Candidata. Conferir destinos, tratamento da consulta, limites e controles de ritmo. Não classificar como base de dados. |
| Google Dork Generator | Construção de consultas | Montar buscas com site, filetype, intitle, inurl, datas e operadores booleanos | Candidata. A geração de uma consulta não comprova existência ou acesso aos documentos retornados. Conferir interface e URL própria. |
| Report Composer | Produção de relatórios | Organizar e exportar resultados em PDF, DOCX e Markdown | Candidata. Formatos e processamento no navegador são declarados pelo site; exportação e ausência de transmissão não foram auditadas. |
| Bookmarklet Library | Catálogo de utilitários de navegador | Inspecionar metadados, DNS, imagens e elementos de páginas | Candidata como coleção. Cada bookmarklet executa código no contexto da página e exige revisão de origem e função. Código não foi executado nesta análise. |
| Notes Organizer | Organização da apuração | Registrar entidades, cronologias, fontes e conflitos | Candidata. Conferir persistência, exportação, recuperação de notas e a declaração de processamento local. Não pressupor privacidade só pela descrição comercial. |

Os nomes acima foram lidos na apresentação pública. Não foram inventados caminhos internos nem publicadas fichas com o mesmo endereço inicial para simular produtos verificados.

## Materiais e fontes editoriais identificados

Beginner Kit, Quiz, Handbook, Blog e páginas de seleção de ferramentas devem ser classificados como formação, documentação ou curadoria, conforme o destino. Não são automaticamente ferramentas de software nem bases de dados.

A página também apresenta Sector035 / Week in OSINT, Indicator Media, OSINTech, Bullshit Hunting, IntelTechniques, OSINT Newsletter, OSINT Group, Signal & Shadow e OSINT Output. Esses links têm natureza editorial ou institucional; a existência de uma newsletter não confirma uma base aberta. Sector035 aparecia com aviso de manutenção/indisponibilidade. O OSINTech demanda distinção entre publicação, versões públicas de repositórios e produtos/dados de acesso restrito.

As checagens independentes dos destinos externos que puderam ser feitas estão em `osint-external-checks.json`. Elas não revelam as ferramentas que ficaram ocultas na lista dinâmica do Vault e não constituem aprovação automática das publicações ou de todos os links contidos nelas.

## Decisão para o catálogo

1. Manter o site como candidato a catálogo, aguardando confirmação de acesso e condições de uso.
2. Manter as nove ferramentas próprias como candidatas, sem inclusão até confirmar URL individual, função, acesso e eventual duplicidade com o Radar.
3. Avaliar o OSINT Grid como catálogo separado; somente suas fontes primárias concretas devem ser cadastradas como bases de dados quando verificadas.
4. Não importar indiscriminadamente categorias de identificação de pessoas ou inteligência de ameaças como bases jornalísticas. Descrever finalidade, universo e limites probatórios de cada recurso.
5. Completar a lista dinâmica com exportação/HTML fornecido pela usuária. Só então será possível afirmar que todas as entradas foram analisadas.

## Conferência dos destinos externos identificados

| Fonte | Resultado da leitura primária | Classificação no Radar |
|---|---|---|
| IntelTechniques | Página institucional com formação, serviços, recursos, ferramentas, livros e revista | Fonte de descoberta; cada produto exige ficha própria e condições de acesso |
| Indicator | Reportagens, briefing, guias e recursos sobre investigação de engano digital; há login e upgrade | Publicação e formação, não base única |
| OSINT Newsletter | Apresentação de newsletter com notícias, ferramentas e técnicas | Fonte editorial; não aprovada como software ou conjunto de dados |
| Bullshit Hunting | Newsletter de Justin Seitz voltada a técnicas e relatos investigativos | Fonte editorial |
| OSINT Group | Artigos sobre inteligência, risco e exposição digital/física | Blog institucional |
| Signal & Shadow | Guias e newsletter; diferencia conteúdo gratuito de métodos e cartões para membros | Formação e referência, com acesso misto |
| OSINT Output | Podcast de Tim e Chris, artigos, recursos e canais externos | Podcast e fonte editorial |
| OSINTech | Requisição direta retornou HTTP 403 | Conteúdo não confirmado nesta requisição; não contornar bloqueio |

Essas leituras distinguem a função dos destinos; não verificam a exatidão de todas as publicações ou todos os produtos que eles mencionam.
