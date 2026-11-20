# Reavaliação das pendências Govteca/Guaraci e OSINT Vault

Data: 20/11/2026. Escopo: catálogo público do Radar 1.0.

## Resultado das 135 pendências

**135 entradas reavaliadas; 49 encaminhadas a 38 novas fichas (37 bases/sistemas/catálogos e uma ferramenta). Permanecem 86 pendências.** Vários recortes compartilham o mesmo sistema de consulta: a relação entre cada entrada e a ficha está preservada em `evaluation.json`. Nenhuma oportunidade, pauta privada ou função do Radar 2.0 foi alterada.

| Resultado | Entradas |
|---|---:|
| Bloqueio | 9 |
| Acesso inconclusivo | 33 |
| Aprovada — novo acesso | 49 |
| Indisponibilidade temporária declarada | 4 |
| Conteúdo/recorte ainda não confirmado | 18 |
| Falta localizar fonte específica | 19 |
| Resposta sem registros | 3 |

## Critérios e achados

- HTTP 200 não é prova de dados utilizáveis: quatro painéis TCESP declaravam indisponibilidade temporária; páginas vazias ou com carregadores ficaram pendentes.
- Três respostas da API de saúde estavam vazias. Isso não prova inexistência da base e não justifica inventar registros.
- Dez indicadores do Inep foram encaminhados às páginas próprias das séries. Seletores anuais e downloads individuais não foram testados.
- APIs do IBGE foram interpretadas integralmente: municípios, distritos, classes e subclasses CNAE. Só metadados de estrutura foram retidos, sem valores de registros.
- A classificação IARC foi localizada na tabela oficial; o endereço anterior apontava para um script. Classificação de perigo não equivale a risco individual.
- O endereço mensal anterior do PNI apontava para dezembro de 2026, ainda futuro na data da revisão. Esse erro foi explicitado, sem concluir que todo o histórico estivesse indisponível.
- Foram encontrados arquivos BA.zip dos censos 2000/2010. Isso não confirma a disponibilidade de todas as UFs; as entradas nacionais continuam pendentes.
- APIs com campos nominais não tiveram valores individuais salvos nos relatórios.

## Novas fichas

| Categoria | Ficha | Fonte |
|---|---|---|
| datasets | Conectividade na Educação | [Acesso](https://conectividadenaeducacao.nic.br) |
| datasets | INEP · taxas de rendimento | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/taxas-de-rendimento-escolar) |
| datasets | INEP · distorção idade-série | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/taxas-de-distorcao-idade-serie) |
| datasets | INEP · adequação da formação docente | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/adequacao-da-formacao-docente) |
| datasets | INEP · Indicador de Nível Socioeconômico (INSE) | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/nivel-socioeconomico) |
| datasets | INEP · esforço docente | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/esforco-docente) |
| datasets | INEP · regularidade do corpo docente | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/regularidade-do-corpo-docente) |
| datasets | INEP · complexidade de gestão da escola | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/complexidade-de-gestao-da-escola) |
| datasets | INEP · alunos por turma | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/media-de-alunos-por-turma) |
| datasets | INEP · horas-aula diárias | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/media-de-horas-aula-diaria) |
| datasets | INEP · docentes com curso superior | [Acesso](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais/percentual-de-docentes-com-curso-superior) |
| datasets | PMMB, histórico de cadastro no CNES | [Acesso](https://apidadosabertos.saude.gov.br/atencao-primaria/pmmb-relatorio-historico-cadastro-cnes) |
| datasets | SIAPS · cadastro individual | [Acesso](https://apidadosabertos.saude.gov.br/atencao-primaria/siaps-cadastro-individual) |
| datasets | PMME · instituições formadoras | [Acesso](https://apidadosabertos.saude.gov.br/atencao-primaria/pmme-instituicoes-formadoras) |
| datasets | Controle de PCDT | [Acesso](https://apidadosabertos.saude.gov.br/ciencia-tecnologia/dgits-controle-pcdt) |
| datasets | Macrorregião e região de saúde | [Acesso](https://apidadosabertos.saude.gov.br/macrorregiao-e-regiao-de-saude/municipio) |
| datasets | Distribuição de insumos (EPI) | [Acesso](https://apidadosabertos.saude.gov.br/prevencao-e-promocao/distribuicao-epi-insumo) |
| datasets | SESAI · assistência farmacêutica | [Acesso](https://apidadosabertos.saude.gov.br/saude-indigena/sesai-assistencia-farmaceutica) |
| datasets | População residente (SVSA) | [Acesso](https://apidadosabertos.saude.gov.br/vigilancia-e-meio-ambiente/svsa-populacao-residente) |
| datasets | IBGE · localidades, municípios | [Acesso](https://servicodados.ibge.gov.br/api/v1/localidades/municipios) |
| datasets | IBGE · localidades, distritos | [Acesso](https://servicodados.ibge.gov.br/api/v1/localidades/distritos) |
| datasets | CNAE · classes | [Acesso](https://servicodados.ibge.gov.br/api/v2/cnae/classes) |
| datasets | CNAE · subclasses | [Acesso](https://servicodados.ibge.gov.br/api/v2/cnae/subclasses) |
| datasets | SICONFI — API de declarações fiscais | [Acesso](https://apidatalake.tesouro.gov.br/docs/siconfi/) |
| datasets | Ipeadata — API de séries e metadados | [Acesso](https://ipeadata.gov.br/api/) |
| datasets | SICOR — API de crédito rural | [Acesso](https://olinda.bcb.gov.br/olinda/servico/SICOR/versao/v2/odata/) |
| datasets | Rio de Janeiro — índice diário de qualidade do ar | [Acesso](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Meio_Ambiente/Dados_di%C3%A1rios_do_%C3%8Dndice_de_Qualidade_do_ar_IQAR/MapServer/1) |
| datasets | FHEMIG — catálogo de indicadores hospitalares | [Acesso](https://www.dados.mg.gov.br/pt_BR/dataset/?organization=fundacao-hospitalar-do-estado-de-minas-gerais-fhemig&res_format=JSON) |
| datasets | IARC — classificações das Monografias | [Acesso](https://monographs.iarc.who.int/list-of-classifications) |
| datasets | SIAB — atenção básica e Saúde da Família (1998–2015) | [Acesso](https://datasus.saude.gov.br/atencao-basica-saude-da-familia-de-1998-a-2015/) |
| datasets | SIM — tabulações de mortalidade desde 1996 | [Acesso](https://datasus.saude.gov.br/mortalidade-desde-1996-pela-cid-10/) |
| datasets | PNAD COVID-19 — microdados históricos | [Acesso](https://www.ibge.gov.br/estatisticas/investigacoes-experimentais/estatisticas-experimentais/27947-divulgacao-mensal-pnadcovid2.html?=&t=microdados) |
| datasets | Censo 2022 — acesso aos microdados da amostra | [Acesso](https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html?edicao=47850&t=microdados) |
| datasets | MTE — microdados RAIS e CAGED | [Acesso](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/microdados-rais-e-caged) |
| datasets | IPCA · grupos, subgrupos e itens | [Acesso](https://sidra.ibge.gov.br/tabela/7060) |
| datasets | INPC · grupos, subgrupos e itens | [Acesso](https://sidra.ibge.gov.br/tabela/7063) |
| datasets | IPCA-15 · grupos, subgrupos e itens | [Acesso](https://sidra.ibge.gov.br/tabela/7062) |
| tools | Pesquisa no Diário Oficial da União | [Acesso](https://www.in.gov.br/consulta) |

## OSINT Vault

Avaliação **parcial**: apresentação, nove ferramentas próprias e oito destinos externos examinados ou com bloqueio registrado. A lista dinâmica interna não foi obtida. Nenhuma ficha do Vault foi publicada. Veja [o parecer completo](OSINT_VAULT.md), com classificação e limites por recurso. É necessário HTML completo/ZIP ou exportação da lista para concluir a auditoria interna.

## Rastreabilidade e verificação

- `evaluation.json`: decisão, motivo e relação com ficha para todas as 135 entradas.
- `source-checks.json`: metadados de acesso, estrutura e hashes das respostas; sem valores individuais das linhas.
- `osint-external-checks.json`: checagens independentes dos destinos externos.
- `../../intake/manual-pending-2026-11-20.json`: manifesto editorial das 38 fichas.
- Validação do manifesto: 38 registros, publicação idempotente. Validação do catálogo: zero erros e zero avisos. Verificações estáticas da interface e sete asserções de publicação passaram. Suíte: 305 testes passaram.

## Inventário das decisões

| Origem | Entrada | Resultado | Ficha de destino |
|---|---|---|---|
| Govteca | Agrofit: consulta de agrotóxicos registrados | Bloqueio | — |
| Govteca | Atlas do Seguro Rural (PSR) | Acesso inconclusivo | — |
| Govteca | Conectividade na Educação | Aprovada — novo acesso | manual-20261120-conectividade-na-educacao |
| Govteca | Dados PNCT: Plano Nacional de Contagem de Tráfego | Acesso inconclusivo | — |
| Govteca | Dias e horários das coletas (SLU-DF) | Acesso inconclusivo | — |
| Govteca | ESIG Recife: Zoneamento do Plano Diretor | Acesso inconclusivo | — |
| Govteca | Estatísticas do Poder Judiciário (CNJ) | Bloqueio | — |
| Govteca | Estatísticas do Sistema Nacional de Adoção e Acolhimento (SNA) | Bloqueio | — |
| Govteca | Ideb - Resultados (Inep) | Acesso inconclusivo | — |
| Govteca | Indicadores de preços do Cepea | Bloqueio | — |
| Govteca | Painel da Primeira Infância (TCE-SP) | Indisponibilidade temporária declarada | — |
| Govteca | Painel da Saúde (TCE-SP) | Indisponibilidade temporária declarada | — |
| Govteca | Painel das Juventudes (Observatório Nacional das Juventudes) | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel de Empresas Ativas (Data Sebrae) | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel de Indicadores do SINISA | Bloqueio | — |
| Govteca | Painel de Informações da RAIS | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel de Informações do Novo Caged | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel de Inspeções do Socioeducativo (CNIUPS/CNJ) | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel de Obras Paralisadas (TCU) | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel de Obras Públicas do Rio | Bloqueio | — |
| Govteca | Painel de Obras (TCE-SP) | Indisponibilidade temporária declarada | — |
| Govteca | Painel de Saneamento Básico do TCE-SP | Indisponibilidade temporária declarada | — |
| Govteca | Painel de Saúde Mental no Socioeducativo | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel de Setores de Risco Geológico do SGB | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel do Déficit Habitacional no Brasil (Fundação João Pinheiro) | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Painel do Perfil da População Acolhida (SMADS São Paulo) | Conteúdo/recorte ainda não confirmado | — |
| Govteca | Pesquisa CNT de Rodovias | Bloqueio | — |
| Govteca | Pesquisa no Diário Oficial da União | Aprovada — novo acesso | manual-20261120-pesquisa-diario-oficial-uniao |
| Govteca | Portal de Emendas Parlamentares (TCE-MG) | Acesso inconclusivo | — |
| Govteca | Siconfi.IA | Acesso inconclusivo | — |
| Govteca | Transferências Constitucionais (Tesouro Nacional) | Conteúdo/recorte ainda não confirmado | — |
| Guaraci | SIM · óbitos fetais | Aprovada — novo acesso | manual-20261120-sim-obitos-fetais |
| Guaraci | SINAN | Falta localizar fonte específica | — |
| Guaraci | SIA-SUS | Falta localizar fonte específica | — |
| Guaraci | PNI (histórico) | Falta localizar fonte específica | — |
| Guaraci | CIHA | Falta localizar fonte específica | — |
| Guaraci | CIH (legado 2008–2010) | Falta localizar fonte específica | — |
| Guaraci | SISCAN | Falta localizar fonte específica | — |
| Guaraci | SISPRENATAL | Falta localizar fonte específica | — |
| Guaraci | RESP | Falta localizar fonte específica | — |
| Guaraci | PCE | Falta localizar fonte específica | — |
| Guaraci | Painel de Oncologia | Falta localizar fonte específica | — |
| Guaraci | Síndrome gripal leve | Falta localizar fonte específica | — |
| Guaraci | Obras de infraestrutura de saúde | Resposta sem registros | — |
| Guaraci | PMMB, histórico de cadastro no CNES | Aprovada — novo acesso | manual-20261120-atencao-primaria-pmmb-relatorio-historico-cadastro-cnes |
| Guaraci | BPS | Acesso inconclusivo | — |
| Guaraci | Controle de PCDT | Aprovada — novo acesso | manual-20261120-ciencia-tecnologia-dgits-controle-pcdt |
| Guaraci | Doses aplicadas (PNI) · arquivos mensais | Bloqueio | — |
| Guaraci | Macrorregião e região de saúde | Aprovada — novo acesso | manual-20261120-macrorregiao-e-regiao-de-saude-municipio |
| Guaraci | Outros temas (CED) | Acesso inconclusivo | — |
| Guaraci | Distribuição de insumos (EPI) | Aprovada — novo acesso | manual-20261120-prevencao-e-promocao-distribuicao-epi-insumo |
| Guaraci | GPM IMERG | Conteúdo/recorte ainda não confirmado | — |
| Guaraci | Estações Automáticas (INMET) | Bloqueio | — |
| Guaraci | Queimadas (BDQueimadas) | Falta localizar fonte específica | — |
| Guaraci | CETESB QUALAR · concentração horária | Acesso inconclusivo | — |
| Guaraci | SIAPS · cadastro individual | Aprovada — novo acesso | manual-20261120-atencao-primaria-siaps-cadastro-individual |
| Guaraci | SICONFI · despesa em saúde | Aprovada — novo acesso | manual-20261120-siconfi-dca-despesa-funcao |
| Guaraci | Acidentes em rodovias federais · pessoas | Conteúdo/recorte ainda não confirmado | — |
| Guaraci | SICONFI · RREO saúde | Aprovada — novo acesso | manual-20261120-siconfi-dca-despesa-funcao |
| Guaraci | PMME · instituições formadoras | Aprovada — novo acesso | manual-20261120-atencao-primaria-pmme-instituicoes-formadoras |
| Guaraci | População residente (SVSA) | Aprovada — novo acesso | manual-20261120-vigilancia-e-meio-ambiente-svsa-populacao-residente |
| Guaraci | SESAI · assistência farmacêutica | Aprovada — novo acesso | manual-20261120-saude-indigena-sesai-assistencia-farmaceutica |
| Guaraci | SESAI · hepatites virais | Resposta sem registros | — |
| Guaraci | SESAI · óbitos | Resposta sem registros | — |
| Guaraci | Doença de Chagas crônica (e-SUS Notifica) | Falta localizar fonte específica | — |
| Guaraci | SISCAN · arquivos CSV | Falta localizar fonte específica | — |
| Guaraci | Cobertura vacinal por residência | Falta localizar fonte específica | — |
| Guaraci | Censo 2022 · amostra | Aprovada — novo acesso | manual-20261120-ibge-censo2022-amostra |
| Guaraci | PNAD COVID-19 | Aprovada — novo acesso | manual-20261120-ibge-pnad-covid19 |
| Guaraci | MI Social | Conteúdo/recorte ainda não confirmado | — |
| Guaraci | SIM · óbitos de residentes no exterior | Aprovada — novo acesso | manual-20261120-sim-obitos-fetais |
| Guaraci | SGB · risco geológico | Acesso inconclusivo | — |
| Guaraci | SGB · suscetibilidade | Acesso inconclusivo | — |
| Guaraci | FUNAI · terras indígenas | Acesso inconclusivo | — |
| Guaraci | FUNAI · aldeias | Acesso inconclusivo | — |
| Guaraci | Disque 100 | Conteúdo/recorte ainda não confirmado | — |
| Guaraci | Infosiga SP · sinistros | Acesso inconclusivo | — |
| Guaraci | Infosiga SP · pessoas | Acesso inconclusivo | — |
| Guaraci | Infosiga SP · veículos | Acesso inconclusivo | — |
| Guaraci | IPEADATA · séries selecionadas | Aprovada — novo acesso | manual-20261120-ipeadata-series |
| Guaraci | IPEADATA · catálogo de séries e territórios | Aprovada — novo acesso | manual-20261120-ipeadata-series |
| Guaraci | CVE-SP · sífilis congênita | Acesso inconclusivo | — |
| Guaraci | CVE-SP · sífilis em gestante | Acesso inconclusivo | — |
| Guaraci | CVE-SP · sífilis adquirida | Acesso inconclusivo | — |
| Guaraci | CVE-SP · HIV em gestante | Acesso inconclusivo | — |
| Guaraci | CVE-SP · aids em adultos | Acesso inconclusivo | — |
| Guaraci | CVE-SP · infecção pelo HIV | Acesso inconclusivo | — |
| Guaraci | Rio de Janeiro · IQAR diário | Aprovada — novo acesso | manual-20261120-rio-iqar-diario |
| Guaraci | Censo 2022 · rendimento do responsável | Falta localizar fonte específica | — |
| Guaraci | IDEB · municípios | Acesso inconclusivo | — |
| Guaraci | SSP-SP · dados criminais | Acesso inconclusivo | — |
| Guaraci | FHEMIG · indicadores hospitalares | Aprovada — novo acesso | manual-20261120-fhemig-indicadores-hospitalares |
| Guaraci | SICOR · crédito rural de custeio | Aprovada — novo acesso | manual-20261120-bcb-sicor-custeio-municipio |
| Guaraci | SICOR · crédito rural de investimento | Aprovada — novo acesso | manual-20261120-bcb-sicor-custeio-municipio |
| Guaraci | SICOR · crédito rural de comercialização | Aprovada — novo acesso | manual-20261120-bcb-sicor-custeio-municipio |
| Guaraci | IBGE · localidades, municípios | Aprovada — novo acesso | manual-20261120-ibge-localidades-municipios |
| Guaraci | IBGE · localidades, distritos | Aprovada — novo acesso | manual-20261120-ibge-localidades-distritos |
| Guaraci | CID-10 · DATASUS | Falta localizar fonte específica | — |
| Guaraci | CNAE · subclasses | Aprovada — novo acesso | manual-20261120-cnae-subclasses |
| Guaraci | CNAE · classes | Aprovada — novo acesso | manual-20261120-cnae-classes |
| Guaraci | TSE · códigos de município (TSE e IBGE) | Conteúdo/recorte ainda não confirmado | — |
| Guaraci | SIAB · situação de saúde | Aprovada — novo acesso | manual-20261120-siab-situacao-saude |
| Guaraci | SIAB · produção e marcadores | Aprovada — novo acesso | manual-20261120-siab-situacao-saude |
| Guaraci | SIAB · cadastro familiar | Aprovada — novo acesso | manual-20261120-siab-situacao-saude |
| Guaraci | SIAB · saneamento das famílias | Aprovada — novo acesso | manual-20261120-siab-situacao-saude |
| Guaraci | HIPERDIA · cadastro de hipertensos e diabéticos | Falta localizar fonte específica | — |
| Guaraci | IPCA · grupos, subgrupos e itens | Aprovada — novo acesso | manual-20261120-ibge-ipca-grupos |
| Guaraci | INPC · grupos, subgrupos e itens | Aprovada — novo acesso | manual-20261120-ibge-inpc-grupos |
| Guaraci | IPCA-15 · grupos, subgrupos e itens | Aprovada — novo acesso | manual-20261120-ibge-ipca15-grupos |
| Guaraci | Censo 2010 · amostra | Falta localizar fonte específica | — |
| Guaraci | Censo 2000 · amostra | Conteúdo/recorte ainda não confirmado | — |
| Guaraci | CAGED antigo · movimentações de 2007 a 2019 | Aprovada — novo acesso | manual-20261120-mte-caged-antigo |
| Guaraci | CAGED antigo · ajustes de 2002 a 2019 | Aprovada — novo acesso | manual-20261120-mte-caged-antigo |
| Guaraci | INEP · taxas de rendimento | Aprovada — novo acesso | manual-20261120-inep-taxas-rendimento |
| Guaraci | INEP · distorção idade-série | Aprovada — novo acesso | manual-20261120-inep-distorcao-idade-serie |
| Guaraci | INEP · adequação da formação docente | Aprovada — novo acesso | manual-20261120-inep-adequacao-formacao-docente |
| Guaraci | INEP · Indicador de Nível Socioeconômico (INSE) | Aprovada — novo acesso | manual-20261120-inep-inse |
| Guaraci | INEP · esforço docente | Aprovada — novo acesso | manual-20261120-inep-esforco-docente |
| Guaraci | INEP · regularidade do corpo docente | Aprovada — novo acesso | manual-20261120-inep-regularidade-docente |
| Guaraci | INEP · complexidade de gestão da escola | Aprovada — novo acesso | manual-20261120-inep-complexidade-gestao |
| Guaraci | INEP · alunos por turma | Aprovada — novo acesso | manual-20261120-inep-alunos-por-turma |
| Guaraci | INEP · horas-aula diárias | Aprovada — novo acesso | manual-20261120-inep-horas-aula |
| Guaraci | INEP · docentes com curso superior | Aprovada — novo acesso | manual-20261120-inep-docentes-curso-superior |
| Guaraci | Censo Escolar · matrículas | Acesso inconclusivo | — |
| Guaraci | Censo Escolar · docentes | Acesso inconclusivo | — |
| Guaraci | Censo Escolar · turmas | Acesso inconclusivo | — |
| Guaraci | Censo Escolar · gestores escolares | Acesso inconclusivo | — |
| Guaraci | Censo Escolar · cursos técnicos | Acesso inconclusivo | — |
| Guaraci | IDEB · escolas | Acesso inconclusivo | — |
| Guaraci | IDEB · Brasil, regiões e UFs | Acesso inconclusivo | — |
| Guaraci | SICONFI · DCA, todos os anexos | Aprovada — novo acesso | manual-20261120-siconfi-dca-despesa-funcao |
| Guaraci | SICONFI · RREO, todos os anexos | Aprovada — novo acesso | manual-20261120-siconfi-dca-despesa-funcao |
| Guaraci | IARC · classificação de agentes das Monografias | Aprovada — novo acesso | manual-20261120-iarc-monografias-classificacoes |
| Guaraci | SB Brasil · levantamento de 1986 | Acesso inconclusivo | — |
| Guaraci | SB Brasil · levantamento de 2003 | Conteúdo/recorte ainda não confirmado | — |
