window.RADAR_PARTS=window.RADAR_PARTS||{};
window.RADAR_PARTS.tools=[
{
  "id": "flourish",
  "name": "Flourish",
  "kind": "gráficos, mapas e narrativas interativas sem programação",
  "url": "https://flourish.studio/",
  "desc": "Editor para criar e incorporar gráficos, mapas e narrativas interativas a partir de dados. O plano gratuito permite publicação pública com atribuição; recursos como exportação, colaboração e personalização variam por plano. Exige cadastro. Antes de publicar, revisar privacidade, permissões e exposição dos dados, além da qualidade estatística e acessibilidade da visualização.",
  "discoveryUrl": "https://flourish.studio/"
},
{
  "id": "kepler-gl",
  "name": "kepler.gl",
  "kind": "exploração visual de dados geoespaciais",
  "url": "https://kepler.gl/",
  "desc": "Aplicação aberta para explorar dados geográficos em camadas, filtros e agregações, com importação de CSV e GeoJSON e integração em aplicações React. Segundo a documentação, os dados importados são processados no navegador. O desempenho depende do equipamento e do volume; conferir coordenadas em WGS84, tipos de campos e serviços externos usados no mapa antes de trabalhar com material sensível.",
  "discoveryUrl": "https://kepler.gl/"
},
{
  "id": "leaflet",
  "name": "Leaflet",
  "kind": "biblioteca JavaScript para mapas interativos",
  "url": "https://leafletjs.com/",
  "desc": "Biblioteca aberta para construir mapas interativos para web e celular, com camadas de tiles, WMS, marcadores e GeoJSON. Exige programação e uma fonte de dados ou mapas de fundo; a biblioteca não fornece, por si, hospedagem nem uma base cartográfica. Serviços de tiles têm regras, atribuição e limites próprios. Revisar acessibilidade, coordenadas e privacidade de dados e requisições externas.",
  "discoveryUrl": "https://leafletjs.com/"
}, 
{
  "id": "h3-geospatial-index",
  "name": "H3 — índice geoespacial hierárquico",
  "kind": "indexação e agregação geoespacial",
  "url": "https://h3geo.org/",
  "desc": "Biblioteca aberta para agrupar coordenadas em células e cruzar bases geográficas em diferentes resoluções. Possui implementações para linguagens como Python e JavaScript. Exige programação; a hierarquia oferece contenção lógica exata, mas contenção geométrica aproximada entre resoluções. Para limites territoriais exatos, complementar com verificações ponto-em-polígono.",
  "discoveryUrl": "https://h3geo.org/docs/"
},
{
  "id": "rawgraphs",
  "name": "RAWGraphs",
  "kind": "visualização de dados e exportação vetorial",
  "url": "https://rawgraphs.io/",
  "desc": "Ferramenta aberta para transformar dados tabulares em visualizações exportáveis em SVG e refináveis em editores vetoriais. Segundo o projeto, os dados inseridos são processados no navegador; também pode ser executada localmente. Requer revisão da qualidade dos dados e das escolhas gráficas; não substitui limpeza, análise estatística ou avaliação de acessibilidade.",
  "discoveryUrl": "https://rawgraphs.io/"
}, 
{
  "id": "rji-chalkbeat-source-auditing-tool",
  "name": "RJI + Chalkbeat — Source Auditing Tool",
  "kind": "auditoria de diversidade de fontes jornalísticas",
  "url": "https://rjionline.org/source-auditing-tool/",
  "desc": "Ferramenta gratuita do Reynolds Journalism Institute e da Chalkbeat para registrar e analisar a diversidade de fontes ouvidas por uma redação. Permite personalizar perguntas, incluir fontes sem e-mail e evitar múltiplas solicitações. A configuração requer contato ou demonstração; o preenchimento é opcional e dados pessoais exigem consentimento, minimização e proteção.",
  "discoveryUrl": "https://rjionline.org/source-auditing-tool"
},
{
  "id": "quiteria-ia-feminista-azmina",
  "name": "QuitérIA — IA feminista de monitoramento legislativo",
  "kind": "monitoramento legislativo e análise de projetos de lei",
  "url": "https://www.elasnocongresso.com.br/ia-feminista",
  "desc": "Ferramenta do Elas no Congresso/AzMina que utiliza modelos BERTimbau para classificar projetos de lei federais em dez temas de gênero e estimar desfavorabilidade. Disponibiliza metodologia, dados, código e documentação de API. Classificações automatizadas exigem conferência humana; os resultados não substituem análise jurídica, contexto legislativo nem verificação das proposições originais.",
  "discoveryUrl": "https://www.elasnocongresso.com.br/quiteria"
},
  {
    "id": "arctic-shift-reddit-archive",
    "name": "Arctic Shift — arquivo e API do Reddit",
    "kind": "pesquisa histórica de publicações e comentários do Reddit",
    "url": "https://arctic-shift.photon-reddit.com/search",
    "desc": "Pesquisa posts, comentários e comunidades do Reddit, com API para consultas, agregações e séries temporais. Útil para rastrear discussões e mudanças em comunidades públicas. A cobertura histórica é incompleta, a disponibilidade não é garantida e resultados devem ser confirmados com contexto, data e fonte original. Respeite privacidade e regras de uso dos dados.",
    "discoveryUrl": "https://github.com/ArthurHeitmann/arctic_shift/blob/master/api/README.md"
  },
  {
    "id": "web-archive-viewer",
    "name": "Web Archive Viewer",
    "kind": "extensão de navegador para consultar arquivos históricos da web",
    "url": "https://webinternetarchive.com/",
    "desc": "Consulta URLs em oito arquivos públicos, incluindo Wayback Machine, Archive.today, Arquivo.pt e Common Crawl. Busca e abertura de capturas são gratuitas, sem cadastro; comparação avançada, exportações e pesquisa em lote podem exigir plano Pro. Uma captura não comprova, isoladamente, autenticidade ou integridade da página original; confirme datas, contexto e conteúdo.",
    "discoveryUrl": "https://webinternetarchive.com/faq"
  },
  {
    "id": "dochush-pdf-redaction-checker",
    "name": "DocHush — PDF Redaction Checker",
    "kind": "verificação local de riscos de vazamento em PDFs com tarjas",
    "url": "https://dochush.com/tools/pdf-redaction-checker/",
    "desc": "Verificador gratuito e de código aberto executado no navegador para identificar texto recuperável sob tarjas, camadas invisíveis, metadados, anexos e revisões anteriores em PDFs. Segundo o projeto, os arquivos não são enviados ao servidor. A análise tem cobertura limitada: não lê texto dentro de imagens por OCR nem garante ausência de vazamentos. Não confundir com o aplicativo comercial DocHush para redação de PDFs.",
    "discoveryUrl": "https://github.com/dochush/pdf-redaction-checker"
  },
  {
    "id": "pangram-ai-detector",
    "name": "Pangram — detector de texto gerado por IA",
    "kind": "triagem probabilística de possível autoria por inteligência artificial",
    "url": "https://www.pangram.com/",
    "desc": "Analisa textos para estimar sinais estatísticos de geração ou assistência por IA, inclusive em português. Plano gratuito anunciado de até 2.000 palavras por dia; uso intensivo e API são pagos. A avaliação é probabilística, não prova autoria nem fraude: há falsos positivos e negativos, sobretudo em textos curtos, traduções, conteúdos editados ou muito formatados. Nunca usar como evidência única para acusar uma pessoa ou publicar conclusões.",
    "discoveredVia": ["CJR"],
    "discoveryUrl": "https://www.cjr.org/laurels-and-darts/slippery-slop-wall-street-journal-opinion-artificial-intelligence-druckenmiller-gigot-bessent-florida-climate-change-textbook-removal-desantis-joliet-illinois-prison-fires-deaths-treatment-center.php"
  },
  {
    "id": "indicator-osint-navigator",
    "name": "Indicator — OSINT Navigator",
    "kind": "busca e recomendação de ferramentas de investigação em fontes abertas",
    "url": "https://navigator.indicator.media/",
    "desc": "Catálogo pesquisável de ferramentas OSINT para encontrar recursos por tarefa investigativa. Reúne ferramentas de diretórios independentes e oferece recomendações contextualizadas; a busca pública é gratuita, enquanto limites e recursos avançados podem variar conforme a modalidade de acesso. O próprio serviço não executa as ferramentas nem verifica automaticamente os resultados de uma investigação. Confira documentação, disponibilidade, custos, privacidade e adequação jurídica antes de utilizar qualquer ferramenta recomendada.",
    "discoveredVia": ["Indicator"],
    "discoveryUrl": "https://indicator.media/p/osint-navigator-is-now-publicly-available"
  },
  {
    "id": "normal-tools",
    "name": "Normal Tools",
    "kind": "coleção de utilitários locais para texto, dados, arquivos e desenvolvimento",
    "url": "https://www.normaltools.com/",
    "desc": "Coleção gratuita de 193 utilitários web sem login ou instalação, incluindo diff de texto, formatação e validação de JSON, conversões CSV/JSON e delimitadores, visualizador de CSV, hashes, Markdown, imagens e PDFs. A maioria roda no navegador e o site afirma não salvar as entradas, mas convém evitar material confidencial e verificar a política e o código da ferramenta usada. Alguns cálculos seguem pressupostos ou formatos específicos e resultados críticos exigem conferência independente.",
    "discoveredVia": [
      "Quantum of Sollazzo"
    ],
    "discoveryUrl": "https://buttondown.com/puntofisso/archive/674-quantum-of-sollazzo/"
  },
  {
    "id": "bellingcat-wildfire-damage-guide",
    "name": "Bellingcat — guia para investigar danos de incêndios florestais",
    "kind": "guia prático de investigação ambiental com imagens de satélite e SIG",
    "url": "https://www.bellingcat.com/resources/how-tos/2026/06/30/burning-forests-tools-for-tracking-and-reporting-wildfire-damage/",
    "desc": "Guia reproduzível para localizar, medir e contextualizar incêndios com Sentinel-2 no Copernicus Browser, índice NBR, QGIS, Protected Planet e séries históricas do EFFIS. Mostra como delimitar área queimada, estimar severidade, cruzar áreas protegidas e comparar recorrência. Nuvens, datas aproximadas, limiares de NBR, resolução e cobertura dos catálogos podem alterar o resultado; trate estimativas como análise geoespacial documentada e confirme fatos locais antes de publicar.",
    "discoveredVia": [
      "Bellingcat"
    ],
    "discoveryUrl": "https://www.bellingcat.com/resources/how-tos/2026/06/30/burning-forests-tools-for-tracking-and-reporting-wildfire-damage/"
  },
  {
    "id": "knight-lab-timelinejs",
    "name": "Knight Lab — TimelineJS",
    "kind": "linha do tempo interativa e narrativa visual",
    "url": "https://timeline.knightlab.com/",
    "desc": "Ferramenta gratuita e de código aberto do Knight Lab para criar linhas do tempo multimídia incorporáveis. A versão clássica pode ser alimentada por um modelo de Google Sheets e aceita texto, imagens, áudio, vídeo e mapas; pessoas com experiência técnica também podem usar JSON e personalizar a biblioteca. Em 2026 o laboratório apresentou uma versão reimaginada, ainda descrita como nova geração. Para publicar pela planilha, os dados precisam ficar públicos na web: não use informações pessoais ou apurações sigilosas, restrinja a permissão de edição e teste o embed em celular e desktop antes de publicar."
  },
  {
    "id": "indicator-guides",
    "name": "Indicator Guides",
    "kind": "acervo de guias práticos de OSINT e investigação digital",
    "url": "https://indicator.media/guides",
    "desc": "Coleção pesquisável de guias sobre OSINT, desinformação e investigação digital. Inclui procedimentos para cadeias de publicidade digital, transações em criptomoedas, monitoramento de páginas e palavras-chave, pesquisa no Reddit, busca reversa e outras técnicas. Parte do conteúdo exige assinatura paga; ferramentas citadas podem ter contas, limites ou custos próprios. Tratar os guias como metodologia, preservar evidências e confirmar identidades, vínculos e resultados nas fontes originais.",
    "discoveryUrl": "https://indicator.media/p/briefing-uk-s-new-anti-disinfo-unit"
  },
  {
    "id": "flowsint-osint-graph",
    "name": "Flowsint — investigação OSINT em grafos",
    "kind": "investigação OSINT e análise visual de relações",
    "url": "https://www.flowsint.io/",
    "desc": "Plataforma de código aberto para estruturar investigações em grafos de entidades e relações. Oferece enriquecedores para domínios, IPs, ASN, e-mails, criptocarteiras, organizações, telefones, perfis sociais e sites, além de webhooks para fluxos próprios. A instalação requer Docker, Docker Compose, Make e Git; alguns serviços exigem chaves de API e podem ter custos ou limites externos. Resultados de enriquecimento são pistas e exigem verificação independente, atenção a homônimos, privacidade e contexto.",
    "discoveryUrl": "https://www.flowsint.io/docs/getting-started/quickstart"
  },
  {
    "id": "bellingcat-auto-archiver",
    "name": "Bellingcat — Auto Archiver",
    "kind": "preservação automatizada de evidências digitais",
    "url": "https://github.com/bellingcat/auto-archiver",
    "desc": "Ferramenta de código aberto para arquivar páginas, publicações e mídias digitais em fluxos colaborativos e em lote. Oferece módulos de coleta, extração, metadados, armazenamento e verificações de integridade; a versão atual inclui interface para equipes e mecanismos de hash e cadeia de custódia. A implantação própria requer configuração técnica e armazenamento; a demonstração hospedada tem acesso restrito e cotas. Nem todas as plataformas ou conteúdos protegidos podem ser capturados, e hash isolado não comprova autenticidade ou cadeia de custódia jurídica.",
    "discoveredVia": [
      "Bellingcat"
    ],
    "discoveryUrl": "https://www.bellingcat.com/resources/2025/08/13/the-open-source-tool-that-has-preserved-150000-pieces-of-online-evidence"
  },
  {
    "id": "bellingcat-turnstone",
    "name": "Bellingcat — Turnstone",
    "kind": "análise espacial e histórica de rastreamento aéreo (ADS-B)",
    "url": "https://www.bellingcat.com/resources/2026/03/05/turnstone-flight-tracking-tool/",
    "desc": "Ferramenta aberta da Bellingcat para investigar padrões de voos e deslocamentos de aeronaves ao longo do tempo, com filtros geográficos, tipo de aeronave e comparação de áreas. Código-fonte disponível no GitHub (bellingcat/adsb-history); acesso à instância hospedada concedido seletivamente a jornalistas e pesquisadores mediante solicitação, em razão dos custos de dados. Dados ADS-B e estimativas MLAT podem ter lacunas e posições imprecisas; proprietários, operadores e classificações automáticas devem ser confirmados em registros independentes.",
    "discoveredVia": [
      "Bellingcat"
    ],
    "discoveryUrl": "https://www.bellingcat.com/resources/2026/03/05/turnstone-flight-tracking-tool/"
  },
  {
    "id": "abraji-cruzagrafos",
    "name": "Abraji — CruzaGrafos",
    "kind": "investigação de redes e cruzamento de dados públicos",
    "url": "https://www.abraji.org.br/projetos/cruzagrafos",
    "desc": "Ferramenta de grafos da Abraji e Brasil.IO para investigar relações entre pessoas, empresas, candidaturas, contratos e outras bases públicas. Permite explorar conexões e exportar relações para análise. A página oficial atual informa acesso exclusivo a associados da Abraji, mediante login. Relações encontradas são pistas, não provas de irregularidade; confirmar homônimos, dados e contexto nas fontes originais.",
    "discoveredVia": [
      "Abraji"
    ],
    "discoveryUrl": "https://abraji.org.br/help-desk/manual-do-cruzagrafos"
  },
  {
    "id": "who-heat-health-equity-assessment-toolkit",
    "name": "WHO — Health Equity Assessment Toolkit (HEAT e HEAT Plus)",
    "kind": "análise e visualização de desigualdades em saúde",
    "url": "https://www.who.int/data/inequality-monitor/assessment_toolkit",
    "desc": "Aplicação gratuita da OMS para explorar, comparar e relatar desigualdades em saúde por meio de medidas-resumo, gráficos, mapas e tabelas exportáveis. O HEAT online usa os conjuntos do Health Inequality Data Repository; o HEAT Plus para Windows permite carregar dados próprios e inclui modelo e validador de entrada. A ferramenta não harmoniza automaticamente fontes incompatíveis: resultados dependem dos metadados, denominadores, recortes e qualidade dos dados, e parte do repositório vem de fontes externas que não são estimativas oficiais da OMS.",
    "discoveredVia": [
      "WHO — Health Inequality Monitor"
    ],
    "discoveryUrl": "https://www.who.int/data/inequality-monitor/assessment_toolkit"
  },
  {
    "id": "gijn-investigative-impact",
    "name": "GIJN — Investigative Impact",
    "kind": "guia e acervo de planejamento e avaliação de impacto jornalístico",
    "url": "https://impact.gijn.org/",
    "desc": "Recurso gratuito da GIJN para estudar como investigações geram mudanças públicas. Reúne dez estudos de caso — incluindo Brasil, Costa Rica, México e investigações transnacionais —, entrevistas com jornalistas de 20 países, relatório, infográfico e referências. É útil para formular teoria de mudança, distribuição e indicadores de impacto, mas os casos são exemplos históricos e não fornecem uma métrica causal universal; resultados e atribuição precisam ser documentados no contexto de cada projeto.",
    "discoveredVia": [
      "GIJN"
    ],
    "discoveryUrl": "https://impact.gijn.org/"
  },
  {
    "id": "gijn-international-research-guide",
    "name": "GIJN — International Research Guide",
    "kind": "guia metodológico de pesquisa internacional, documentos ocultos e OSINT",
    "url": "https://gijn.org/resource/henk-van-ess-international-research-guide-online",
    "desc": "Guia gratuito de Henk van Ess, publicado pela GIJN em 14/10/2026, para encontrar especialistas e documentos difíceis em temas internacionais. Combina descoberta horizontal de fontes com buscas verticais por domínio nacional e governamental, operadores de arquivo, pesquisa multilíngue, recuperação de links mortos no Wayback Machine e alertas. Também mostra como usar IA para triagem documental mantendo conferência no original e tradução oficial; resultados de busca, arquivo e modelos podem estar incompletos ou enquadrar evidências de modo exagerado, por isso cada afirmação precisa ser validada na fonte primária.",
    "discoveredVia": [
      "GIJN"
    ],
    "discoveryUrl": "https://mailchi.mp/gijn/behind-the-scenes-of-ocean-climate-exposs-finding-experts-documents-on-any-topic-reporting-in-exile"
  },
  {
    "id": "terrabrasilis-sala-situacao-municipal",
    "name": "TerraBrasilis — Sala de Situação Municipal",
    "kind": "painel territorial de desmatamento, degradação, mineração e fogo",
    "url": "https://terrabrasilis.dpi.inpe.br/ams/",
    "desc": "Painel oficial do INPE que integra indicadores dos projetos PRODES, DETER e Queimadas e permite observar áreas críticas por estado, município, células de 25 × 25 km ou 150 × 150 km e diferentes períodos. A versão municipal detalha células de 5 × 5 km e gera um link estável por cidade; usuários cadastrados também podem consultar um indicador de risco de desmatamento de curto prazo desenvolvido pelo Ibama. Os agregados podem variar em relação a outros painéis por diferenças metodológicas, DETER não é taxa anual consolidada e alertas ou risco futuro não comprovam infração sem verificação de campo e documentos oficiais.",
    "discoveredVia": [
      "INPE — BiomasBR / DesagregaBiomasBR"
    ],
    "discoveryUrl": "https://data.inpe.br/biomasbr/sala-de-situacao-municipal-e-a-nova-ferramenta-do-terrabrasilis-para-apoiar-estados-e-municipios-no-controle-do-desmatamento-e-fogo/"
  },
  {
    "id": "escola-dados-ebook-analise-educacional",
    "name": "Escola de Dados — Análise de Dados Educacionais (e-book)",
    "kind": "guia gratuito de análise de dados e políticas educacionais",
    "url": "https://escoladedados.org/wp-content/uploads/2022/01/Ebook-DadosEducacionais.pdf",
    "desc": "E-book Análise de dados educacionais: Aplicando evidências na gestão pública, da Escola de Dados com parceiros, lançado em 2022. Introduz obtenção, leitura, interpretação e aplicação de indicadores educacionais no planejamento e avaliação de políticas. Útil como referência de formação para a pauta de desigualdade entre escolas; verificar ano, metodologia e atualidade das bases citadas. É material metodológico, não uma base atualizada nem edital.",
    "discoveredVia": [
      "Escola de Dados / OKBR"
    ],
    "discoveryUrl": "https://escoladedados.org/wp-content/uploads/2022/01/Ebook-DadosEducacionais.pdf"
  },
  {
    "id": "yt-dlp",
    "name": "yt-dlp",
    "kind": "coleta e preservação de áudio e vídeo online por linha de comando",
    "url": "https://github.com/yt-dlp/yt-dlp",
    "desc": "Ferramenta livre de linha de comando para baixar vídeo, áudio, legendas e metadados de milhares de sites, útil na preservação de evidências audiovisuais públicas e na documentação de investigações. Os extratores podem quebrar quando as plataformas mudam e alguns recursos dependem de FFmpeg e de um runtime JavaScript; registre URL, data, hash e contexto da coleta, confira o conteúdo e respeite termos de uso, direitos autorais, privacidade e controles de acesso."
  },
  {
    "id": "gijn-icij-crypto-investigation-guide",
    "name": "GIJN / ICIJ — Guia para investigar criptomoedas",
    "kind": "guia metodológico de investigação financeira e análise de blockchain",
    "url": "https://gijn.org/resource/reporters-guide-to-investigating-cryptocurrency/",
    "desc": "Guia gratuito de investigação jornalística sobre transações em criptoativos, identificação e verificação de carteiras, rastreamento de fluxos, uso de exploradores e APIs, checagem com especialistas e cuidados para evitar atribuições incorretas e dupla contagem. Produzido em colaboração com o ICIJ a partir de experiências da investigação Coin Laundry. Recurso metodológico, não um conjunto de dados original nem uma oportunidade de financiamento.",
    "discoveredVia": [
      "GIJN"
    ],
    "discoveryUrl": "https://gijn.org/resource/reporters-guide-to-investigating-cryptocurrency/"
  },
  {
    "id": "caixa-ferramentas-jornalismo-dados",
    "name": "Caixa de Ferramentas do Jornalismo de Dados",
    "kind": "catálogo colaborativo de ferramentas para jornalismo de dados",
    "url": "https://kit.jornalismodedados.org.br/",
    "desc": "Catálogo aberto da Escola de Dados / Open Knowledge Brasil com 226 recursos para visualização, extração, análise, cartografia, limpeza, redes, OSINT, inteligência artificial e bancos de dados. Permite filtrar por categoria, plataforma e código aberto; o conteúdo é licenciado em CC BY 4.0 e mantido de forma colaborativa no GitHub. É uma camada de descoberta: disponibilidade, segurança, preço, licença e qualidade de cada ferramenta indicada precisam ser conferidos no site original antes do uso.",
    "discoveryUrl": "https://kit.jornalismodedados.org.br/"
  },
  {
    "id": "traceon-re",
    "name": "TRACEON.re",
    "kind": "busca e monitoramento de inteligência de ameaças no Telegram",
    "url": "https://traceon.re/",
    "desc": "Plataforma gratuita que indexa mais de 90 milhões de mensagens de canais e grupos do Telegram e oferece busca por palavra-chave, remetente, canal e data, monitoramento em tempo real, consultas booleanas, linha do tempo, buscas salvas e exportação CSV. Exige conta verificada. A cobertura se limita aos espaços ingeridos pelo serviço e não representa todo o Telegram; identidades, correlações com fóruns e dados pessoais devem ser usados apenas com finalidade legítima, minimização de dano e confirmação independente.",
    "discoveredVia": [
      "Indicator"
    ],
    "discoveryUrl": "https://indicator.media/p/briefing-us-interferes-in-the-name-of-non-interference"
  },
  {
    "id": "opencheck-world",
    "name": "OpenCheck",
    "kind": "pesquisa de empresas, beneficiários e dados societários abertos",
    "url": "https://opencheck.world/",
    "desc": "Ferramenta gratuita que reúne dados corporativos de dezenas de registros, listas de sanções, fontes de beneficiários finais e conjuntos investigativos em um grafo compatível com o Beneficial Ownership Data Standard 0.4. Permite pesquisar por empresa, identificador nacional, LEI ou pessoa e executar verificações ao vivo. A presença de um dirigente, acionista registrado ou nome semelhante não comprova beneficiário final nem identidade; cobertura, atualização e acesso variam por jurisdição, e toda relação deve ser confirmada no registro original.",
    "discoveredVia": [
      "Indicator"
    ],
    "discoveryUrl": "https://indicator.media/p/briefing-us-interferes-in-the-name-of-non-interference"
  },
  {
    "id": "genero-numero-do-dado-a-decisao",
    "name": "Gênero e Número — Do dado à decisão",
    "kind": "cartilha metodológica sobre evidências e violência de gênero",
    "url": "https://www.generonumero.media/artigos/cartilha-violencia-de-genero/",
    "desc": "Guia de leitura crítica de dados sobre violência de gênero: apresenta bases brasileiras, recortes e limitações, problemas de subnotificação e preenchimento, cuidados no cruzamento de indicadores e checklist de uso responsável. O acesso ao material integral é oferecido pela organização mediante formulário. É um recurso metodológico, não uma base de dados primários nem oportunidade de financiamento.",
    "discoveredVia": [
      "Gênero e Número"
    ],
    "discoveryUrl": "https://www.generonumero.media/artigos/cartilha-violencia-de-genero/"
  },
  {
    "id": "open-measures-public-app",
    "name": "Open Measures — Public App e API",
    "kind": "OSINT e análise de redes sociais para desinformação e extremismo",
    "url": "https://openmeasures.io/platform",
    "desc": "Plataforma de pesquisa para investigar publicações, redes de influência e circulação de conteúdo em redes sociais, incluindo ambientes alternativos. A modalidade pública oferece interface e API gratuitas com limite de 39 consultas por dia e acesso a dados com pelo menos seis meses de defasagem. É útil para investigações de desinformação e coordenação online; a cobertura das plataformas varia, e dados encontrados exigem contextualização e checagem independente. Recursos avançados são pagos.",
    "discoveredVia": [
      "Open Measures"
    ],
    "discoveryUrl": "https://docs.openmeasures.io/docs/guides/public-app"
  },
  {
    "id": "solutions-journalism-basic-toolkit",
    "name": "Solutions Journalism Network — Kit de Ferramentas Básicas",
    "kind": "guia gratuito de metodologia e apuração em jornalismo de soluções",
    "url": "https://www.solutionsjournalism.org/learning-lab/toolkits-guides/kit-de-ferramentas-basicas",
    "desc": "Guia em português da Solutions Journalism Network, traduzido em parceria com a Fiocruz. Apresenta critérios, métodos de reportagem, entrevistas, verificação de evidências e construção narrativa para investigar respostas a problemas sociais. Recurso de formação metodológica, não um conjunto de dados nem uma chamada de financiamento; a organização informa disponibilidade do toolkit em 19 idiomas.",
    "discoveredVia": [
      "Solutions Journalism Network"
    ],
    "discoveryUrl": "https://www.solutionsjournalism.org/learning-lab/toolkits-guides/basic-toolkit"
  },
  {
    "id": "desagrega-biomas-br",
    "name": "DesagregaBiomasBR",
    "kind": "plugin QGIS para seleção, recorte e desagregação de dados ambientais oficiais",
    "url": "https://plugins.qgis.org/plugins/DesagregaBiomasBR/",
    "desc": "Plugin gratuito desenvolvido no âmbito do AIM4Forests por FAO e INPE. Oferece um assistente guiado no QGIS para acessar e recortar dados oficiais do PRODES, DETER, TerraClass e Área Queimada por estado, município, propriedade, bacia ou área de interesse. A versão estável 1.1 é compatível com QGIS 3.x e o código está disponível no GitHub. Facilita mapas e cruzamentos ambientais, mas não substitui a leitura das metodologias de cada produto; datas de referência, classes, resolução e regras de detecção variam e os resultados devem ser conferidos na fonte original.",
    "discoveredVia": [
      "INPE — BiomasBR / DesagregaBiomasBR"
    ],
    "discoveryUrl": "https://www.fao.org/in-action/aim4forests/news-and-events/news/news-detail/brazil-and-fao-join-forces-to-chart-the-way-forward-for-the-monitoring-of-brazil-s-forests-and-launch-a-technical-solution-that-simplifies-access-to-geospatial-data/en"
  },
  {
    "id": "meaningfully-semantic-search",
    "name": "Meaningfully",
    "kind": "busca semântica local em planilhas e arquivos CSV",
    "url": "https://github.com/jeremybmerrill/meaningfully",
    "desc": "Aplicativo open-source criado para jornalistas pesquisarem por significado em uma coluna de texto, mesmo quando os registros não repetem as mesmas palavras. Importa CSV ou planilhas, gera embeddings localmente e permite opcionalmente usar uma chave da OpenAI; também pode ser executado pela linha de comando. É útil para localizar padrões e exemplos em respostas abertas, denúncias ou grandes listas, mas está em estágio alfa, pode ser lento, não é recomendado para mais de 100 mil linhas e os resultados semânticos precisam de revisão humana. Há instaladores para macOS e Linux; o suporte a Windows não foi testado pelo projeto.",
    "discoveredVia": [
      "GIJN"
    ],
    "discoveryUrl": "https://gijn.org/stories/toolbox-search-text-spreadsheet-track-website-changes/"
  },
  {
    "id": "wikimedia-xtools",
    "name": "XTools — Wikimedia",
    "kind": "auditoria de histórico, autoria e padrões de edição na Wikipédia",
    "url": "https://xtools.wmcloud.org/",
    "desc": "Conjunto de ferramentas públicas mantidas no ecossistema Wikimedia para investigar históricos de artigos, participação de editores, autoria por caracteres, contribuições entre projetos, edições automatizadas e mudanças de texto. O Page History permite filtros temporais e análise dos principais editores, com API documentada. Útil como ponto de partida para investigar operações de influência e alterações coordenadas na Wikipédia, mas correlações de edição não demonstram identidade comum ou manipulação. Algumas análises examinam no máximo as 20 mil revisões mais recentes e detecção de reversões tem limitações.",
    "discoveredVia": [
      "Wikimedia XTools"
    ],
    "discoveryUrl": "https://www.mediawiki.org/wiki/XTools/Page_History"
  },
  {
    "id": "infoamazonia-jeo-maps",
    "name": "JEO Maps — InfoAmazonia",
    "kind": "plugin WordPress open-source para geojornalismo, storymaps e geolocalização",
    "url": "https://wordpress.org/plugins/jeowp/",
    "desc": "Plugin aberto da InfoAmazonia para mapas interativos, storymaps, camadas geográficas e reportagens geolocalizadas no WordPress. Suporta MapLibre/Mapbox, geocodificação por Nominatim, geolocalização em lote e recursos opcionais de IA. Exige WordPress. Coordenadas e sugestões geradas automaticamente precisam de revisão editorial e de privacidade.",
    "discoveredVia": [
      "Observatório da Imprensa"
    ],
    "discoveryUrl": "https://www.observatoriodaimprensa.com.br/codesinfo/infoamazonia-lanca-nova-versao-do-jeo-plugin-de-codigo-aberto-que-une-geojornalismo-e-ia/"
  },
  {
    "id": "ocrmypdf",
    "name": "OCRmyPDF",
    "kind": "OCR local e open-source para tornar PDFs digitalizados pesquisáveis",
    "url": "https://ocrmypdf.readthedocs.io/en/latest/",
    "desc": "Aplicação e biblioteca Python que adiciona uma camada de texto pesquisável a PDFs escaneados usando Tesseract, preservando o conteúdo original sempre que possível. Oferece correção de inclinação, otimização, saída PDF/A, processamento em lote, Docker, API e plugins, sendo útil para transformar dossiês e documentos públicos digitalizados em acervos pesquisáveis sem enviá-los a serviços externos. A precisão depende da qualidade da imagem e do idioma configurado; não reconhece manuscritos, pode errar a ordem de leitura em múltiplas colunas e gerar texto incorreto. PDFs potencialmente maliciosos exigem isolamento e todo resultado jornalístico deve ser conferido na imagem original.",
    "discoveredVia": [
      "OCRmyPDF"
    ],
    "discoveryUrl": "https://ocrmypdf.readthedocs.io/en/latest/introduction.html"
  },
  {
    "id": "llamaindex-liteparse",
    "name": "LiteParse",
    "kind": "parser local e open-source de PDFs e documentos com OCR opcional",
    "url": "https://github.com/run-llama/liteparse",
    "desc": "Ferramenta Apache-2.0 da LlamaIndex para extrair texto espacial e caixas delimitadoras sem enviar os arquivos à nuvem. Processa PDFs e converte DOCX, XLSX, PPTX e imagens; oferece Tesseract embutido ou OCR externo e exporta Markdown, JSON, texto e screenshots via Python, Node/TypeScript, Rust, CLI ou navegador/WASM. É útil para triagem e criação de acervos pesquisáveis, mas a própria documentação recomenda ferramentas mais robustas para tabelas densas, múltiplas colunas, gráficos, manuscritos e digitalizações complexas; a extração deve ser amostrada e conferida antes de uso jornalístico.",
    "discoveredVia": [
      "Quantum of Sollazzo"
    ],
    "discoveryUrl": "https://buttondown.com/puntofisso/archive/677-quantum-of-sollazzo/"
  },
  {
    "id": "propublica-looper-skills",
    "name": "Looper Skills",
    "kind": "habilidades abertas para inferência em planilhas e análise repetível com IA",
    "url": "https://github.com/propublica/looper-skills",
    "desc": "Projeto open-source da ProPublica para transformar uma pergunta jornalística em um prompt reproduzível aplicado linha a linha a documentos, registros, links ou arquivos. O Looper Prompt Guide registra definições, casos-limite e decisões; há pacote para agentes que leem SKILL.md e uma versão Gem para Gemini. É útil para triagem em escala, mas exige amostragem, avaliação de erros, proteção de dados sensíveis e confirmação humana dos resultados.",
    "discoveredVia": [
      "Open Journalism",
      "ProPublica Open Source"
    ],
    "discoveryUrl": "https://openjournalism.news/2026/09/14/open-journalism-update-august-30-september-12-2026/"
  },
  {
    "id": "backfield-local-angle",
    "name": "Backfield",
    "kind": "extração estruturada, geocodificação e grafo de conhecimento para acervos jornalísticos",
    "url": "https://github.com/localangle/backfield",
    "desc": "Plataforma open-source da Local Angle para transformar reportagens em dados estruturados: extrai e geocodifica lugares, organiza pessoas e citações, conecta pessoas, lugares e organizações em grafo de conhecimento, aplica metadados editoriais e permite busca semântica e extrações customizadas. O código é Apache-2.0 e pode ser auto-hospedado; a implantação exige infraestrutura própria e integrações externas opcionais.",
    "discoveredVia": [
      "Open Journalism",
      "Local Angle"
    ],
    "discoveryUrl": "https://openjournalism.news/2026/09/14/open-journalism-update-august-30-september-12-2026/"
  },
  {
    "id": "occrp-id",
    "name": "OCCRP ID",
    "kind": "índice global de registros e apoio à pesquisa investigativa",
    "url": "https://id.occrp.org/als.php",
    "desc": "Serviço do OCCRP que reúne um índice público de mais de mil fontes de registros empresariais, fundiários e judiciais em mais de 180 países. A equipe de pesquisa e bases comerciais é voltada a membros e parceiros do OCCRP, mas o índice de fontes é público e útil para localizar registros estrangeiros; cada achado deve ser confirmado no registro de origem.",
    "discoveredVia": [
      "OCCRP"
    ],
    "discoveryUrl": "https://id.occrp.org/als.php"
  },
  {
    "id": "opencorporates-api",
    "name": "OpenCorporates API",
    "kind": "pesquisa e reconciliação de empresas",
    "url": "https://api.opencorporates.com/",
    "desc": "API de uma base global de empresas construída a partir de fontes públicas primárias, com proveniência por registro e integração de reconciliação com OpenRefine. Útil para localizar entidades jurídicas e normalizar nomes entre países. Acesso, limites e licenciamento variam por uso; registros devem ser confirmados no registro empresarial original antes de publicação.",
    "discoveredVia": [
      "OpenCorporates"
    ],
    "discoveryUrl": "https://api.opencorporates.com/"
  },
  {
    "id": "opensanctions-api",
    "name": "OpenSanctions API",
    "kind": "busca, matching e reconciliação de entidades",
    "url": "https://api.opensanctions.org/docs",
    "desc": "API para pesquisar e cruzar pessoas, empresas, PEPs, sanções e entidades relacionadas. Oferece search, match, entities, statements e reconciliação com OpenRefine; o OpenSanctions informa chaves gratuitas para trabalho de interesse público, incluindo jornalismo. Scores de busca não equivalem a confirmação de identidade: revisar fontes, identificadores e possíveis homônimos.",
    "discoveredVia": [
      "OpenSanctions"
    ],
    "discoveryUrl": "https://www.opensanctions.org/docs/api/"
  },
  {
    "id": "bellingcat-online-investigations-toolkit",
    "name": "Bellingcat Online Investigations Toolkit",
    "kind": "catálogo colaborativo de ferramentas OSINT",
    "url": "https://www.bellingcat.com/resources/2024/09/24/bellingcat-online-investigations-toolkit/",
    "desc": "Catálogo mantido pela comunidade Bellingcat para localizar ferramentas de investigação aberta em mapas e satélites, redes sociais, transporte, arquivamento, empresas e outras categorias. As fichas registram custo, dificuldade, requisitos, limitações, considerações éticas e guias. É uma camada de descoberta: disponibilidade e resultados de cada ferramenta precisam ser verificados individualmente.",
    "discoveredVia": [
      "Bellingcat"
    ],
    "discoveryUrl": "https://www.bellingcat.com/resources/2024/09/24/bellingcat-online-investigations-toolkit/"
  },
  {
    "id": "monitor-diario",
    "name": "Monitor Diário",
    "kind": "monitoramento automatizado de Diários Oficiais do Nordeste",
    "url": "https://codesinfo.com.br/solucoes/monitor-diario/",
    "desc": "Plataforma open-source da Agência Tatu para monitorar diariamente os Diários Oficiais dos nove estados do Nordeste por temas e palavras-chave, gerando alertas, resumos e referências ao documento e à página de origem. Útil para contratos, nomeações, licitações, obras, saúde e educação; resultados de IA são triagem e devem ser conferidos no Diário Oficial original.",
    "discoveredVia": [
      "Codesinfo"
    ],
    "discoveryUrl": "https://codesinfo.com.br/solucoes/monitor-diario/"
  },
  {
    "id": "jor-mcp",
    "name": "Jor-MCP",
    "kind": "infraestrutura MCP para acervos jornalísticos",
    "url": "https://codesinfo.com.br/solucoes/jor-mcp/",
    "desc": "Servidor open-source da Ambiental Media, sob licença Apache 2.0, para expor conteúdos e acervos jornalísticos a sistemas de IA em formato estruturado e com regras próprias de acesso, atribuição e licenciamento. Oferece busca, recuperação de texto limpo e listagem de publicações recentes; exige implantação e governança próprias.",
    "discoveredVia": [
      "Codesinfo"
    ],
    "discoveryUrl": "https://codesinfo.com.br/solucoes/jor-mcp/"
  },
  {
    "id": "jeo-infoamazonia",
    "name": "JEO",
    "kind": "geojornalismo e mapas no WordPress",
    "url": "https://codesinfo.com.br/solucoes/jeo/",
    "desc": "Plugin open-source do InfoAmazonia para geolocalizar reportagens, criar mapas e minimapas, organizar conteúdos por território e recomendar matérias por proximidade. Integra Mapbox, MapLibre, react-map-gl e Nominatim e pode usar IA/RAG com revisão humana; é voltado a sites em WordPress.",
    "discoveredVia": [
      "Codesinfo"
    ],
    "discoveryUrl": "https://codesinfo.com.br/solucoes/jeo/"
  },
  {
    "id": "mamute-politico",
    "name": "Mamute Político",
    "kind": "monitoramento legislativo do Congresso Nacional",
    "url": "https://codesinfo.com.br/solucoes/mamute-politico/",
    "desc": "Plataforma open-source do Correio Sabiá que organiza dados oficiais da Câmara e do Senado para acompanhar projetos, requerimentos, votações e discursos de parlamentares, com alertas e consultas assistidas por IA. Serve como camada de exploração; qualquer conclusão sobre atuação parlamentar deve ser confirmada nos registros oficiais do Congresso.",
    "discoveredVia": [
      "Codesinfo"
    ],
    "discoveryUrl": "https://codesinfo.com.br/solucoes/mamute-politico/"
  },
  {
    "id": "quiteria-azmina",
    "name": "QuitérIA",
    "kind": "monitoramento legislativo de gênero e direitos humanos",
    "url": "https://www.elasnocongresso.com.br/",
    "desc": "Ferramenta do Instituto AzMina, integrada ao Elas no Congresso, que coleta e classifica proposições da Câmara e do Senado com recorte de gênero, raça e direitos das mulheres e pessoas LGBTQIAPN+. A QuitérIA combina processamento de linguagem natural, dados abertos e validação por organizações parceiras; o código e a metodologia estão disponíveis no GitHub do Instituto AzMina. As avaliações automáticas são pistas editoriais, não prova de impacto jurídico ou intenção parlamentar: confirmar cada proposição nas fontes oficiais e examinar classificações e limitações do modelo.",
    "discoveredVia": [
      "AzMina / Elas no Congresso",
      "Observatório da Imprensa"
    ],
    "discoveryUrl": "https://azmina.com.br/reportagens/azmina-lanca-ia-feminista/"
  },
  {
    "id": "world-bank-data360-api",
    "name": "World Bank Data360 API",
    "kind": "API de consulta e extração de dados de desenvolvimento",
    "url": "https://data360.worldbank.org/en/api",
    "desc": "API oficial do Data360 para pesquisar conjuntos e recuperar dados, indicadores, metadados e desagregações por filtros. Útil para consultas reproduzíveis e integração com scripts; a documentação usa OpenAPI 3.0. Conferir metadados, licença e produtor original de cada série, especialmente quando os dados vierem de parceiros do Banco Mundial.",
    "discoveredVia": [
      "World Bank Data360"
    ],
    "discoveryUrl": "https://data360.worldbank.org/en/api"
  },
  {
    "id": "tesseract-ocr",
    "name": "Tesseract OCR",
    "kind": "OCR local para documentos e imagens",
    "url": "https://tesseract-ocr.github.io/tessdoc/",
    "desc": "Motor OCR aberto para extrair texto de imagens e documentos digitalizados, com uso por linha de comando ou API e suporte a vários idiomas por arquivos treinados. Útil para PDFs escaneados recebidos por LAI. Acurácia depende da qualidade da imagem, idioma, layout e pré-processamento; revisar manualmente trechos sensíveis, números e nomes próprios.",
    "discoveredVia": [
      "Tesseract OCR"
    ],
    "discoveryUrl": "https://tesseract-ocr.github.io/tessdoc/"
  },
  {
    "id": "mapshaper",
    "name": "Mapshaper",
    "kind": "edição e simplificação de dados geoespaciais",
    "url": "https://mapshaper.org/",
    "desc": "Ferramenta web e de linha de comando para abrir, converter, simplificar, filtrar, dissolver e exportar Shapefile, GeoJSON, TopoJSON, GeoPackage, FlatGeobuf, GeoParquet, GeoTIFF, KML e CSV. Útil para preparar mapas leves. Conferir projeção, topologia, perda de detalhe e atributos antes de publicar.",
    "discoveredVia": [
      "Mapshaper"
    ],
    "discoveryUrl": "https://mapshaper.org/docs/"
  },
  {
    "id": "overpass-turbo",
    "name": "Overpass Turbo",
    "kind": "consulta e extração de dados OpenStreetMap",
    "url": "https://overpass-turbo.eu/",
    "desc": "Interface web para montar consultas Overpass, visualizar resultados em mapa e exportar elementos do OpenStreetMap por área, tag, tipo ou condição. Boa para localizar escolas, hospitais, igrejas, infraestrutura e mudanças mapeadas. Dados são colaborativos, incompletos e podem conter erros; registrar consulta, data, bbox e tags usadas.",
    "discoveredVia": [
      "Overpass Turbo"
    ],
    "discoveryUrl": "https://wiki.openstreetmap.org/wiki/Overpass_turbo"
  },
  {
    "id": "nominatim",
    "name": "Nominatim",
    "kind": "geocodificação e geocodificação reversa",
    "url": "https://nominatim.org/",
    "desc": "Ferramenta baseada em OpenStreetMap para transformar nomes/endereço em coordenadas e coordenadas em endereços aproximados. Útil para padronizar localidades e conferir pontos de bases públicas. A API pública do OSM tem capacidade limitada e política de uso; para volumes maiores, usar instância própria ou serviço dedicado. Resultados dependem da cobertura e qualidade colaborativa do OSM.",
    "discoveredVia": [
      "Nominatim"
    ],
    "discoveryUrl": "https://operations.osmfoundation.org/policies/nominatim/"
  },
  {
    "id": "indicator-lab",
    "name": "Indicator Lab",
    "kind": "suite de investigação assistida por IA",
    "url": "https://indicator.media/indicator-lab",
    "desc": "Camada paga da Indicator com Spotlight, Scoutpost, Navigator, Splash e Mycroft para planejar investigações, monitorar mudanças, localizar ferramentas, gerar materiais visuais e rodar fluxos locais com modelos próprios. Usar apenas com revisão editorial humana, registro de fontes e cuidado com dados sensíveis, custos de assinatura e dependência de modelos.",
    "discoveredVia": [
      "Indicator"
    ],
    "discoveryUrl": "https://indicator.media/p/the-indicator-lab-is-live-investigations-with-ai"
  },
  {
    "id": "osint-navigator",
    "name": "OSINT Navigator",
    "kind": "busca curada de ferramentas OSINT",
    "url": "https://navigator.indicator.media/",
    "desc": "Catálogo pesquisável de ferramentas OSINT, compilado de toolkits independentes e pensado para encontrar recursos por intenção de investigação. A recomendação deve ser tratada como triagem: confirmar cada ferramenta no site original, revisar riscos legais/éticos, termos de uso e adequação à pauta antes de aplicar.",
    "discoveredVia": [
      "Indicator"
    ],
    "discoveryUrl": "https://indicator.media/p/the-indicator-lab-is-live-investigations-with-ai"
  },
  {
    "id": "duckdb",
    "name": "DuckDB",
    "kind": "análise local de CSV, Parquet e bancos tabulares",
    "url": "https://duckdb.org/",
    "desc": "Banco analítico embutido para consultar arquivos grandes em CSV, Parquet, JSON e bases SQLite/PostgreSQL sem montar um servidor. Bom para cruzamentos reprodutíveis em notebooks e scripts. Registrar versão, caminho dos arquivos, encoding e transformações; consultas rápidas não eliminam validação de tipos, duplicidades e chaves.",
    "discoveredVia": [
      "DuckDB"
    ],
    "discoveryUrl": "https://duckdb.org/docs/current/guides/overview"
  },
  {
    "id": "datasette",
    "name": "Datasette",
    "kind": "publicação e exploração de dados",
    "url": "https://datasette.io/",
    "desc": "Ferramenta aberta para transformar dados estruturados em um site explorável com busca, consultas SQL e API. Útil para publicar bases próprias, protótipos de apuração e anexos verificáveis. Exige revisar privacidade, licenças, campos sensíveis, custo de hospedagem e performance antes de abrir dados ao público.",
    "discoveredVia": [
      "Datasette"
    ],
    "discoveryUrl": "https://docs.datasette.io/en/latest/"
  },
  {
    "id": "openrefine",
    "name": "OpenRefine",
    "kind": "limpeza e reconciliação de dados",
    "url": "https://openrefine.org/",
    "desc": "Software gratuito e aberto para padronizar nomes, agrupar grafias parecidas, filtrar inconsistências, transformar tabelas e repetir operações com histórico reversível. Processa os dados localmente; reconciliação e enriquecimento via serviços externos podem enviar valores para terceiros. Revisar os agrupamentos antes de unir pessoas, empresas ou estabelecimentos.",
    "discoveredVia": [
      "OpenRefine"
    ],
    "discoveryUrl": "https://openrefine.org/privacy"
  },
  {
    "id": "tabula",
    "name": "Tabula",
    "kind": "extração de tabelas de PDF",
    "url": "https://tabula.technology/",
    "desc": "Software gratuito e aberto que roda localmente e extrai tabelas de PDFs com texto para CSV e outros formatos de planilha. Útil para respostas de LAI, relatórios e anexos. Não faz OCR de páginas escaneadas; conferir colunas, linhas, totais e quebras de página no documento original. Requer instalação e Java conforme sistema operacional.",
    "discoveredVia": [
      "Tabula"
    ],
    "discoveryUrl": "https://tabula.technology/"
  },
  {
    "id": "qgis",
    "name": "QGIS",
    "kind": "análise geoespacial e cartografia",
    "url": "https://qgis.org/",
    "desc": "Software gratuito e aberto para editar camadas, cruzar pontos e polígonos, medir áreas, analisar dados geográficos e produzir mapas e atlas. Útil para escolas, infraestrutura e imóveis. Registrar projeção, versão e escala de cada camada; proximidade ou sobreposição espacial não comprova vínculo jurídico, propriedade ou conexão operacional.",
    "discoveredVia": [
      "QGIS"
    ],
    "discoveryUrl": "https://qgis.org/"
  },
  {
    "id": "esri-wayback",
    "name": "Esri World Imagery Wayback",
    "kind": "comparação temporal de imagens",
    "url": "https://livingatlas.arcgis.com/wayback/",
    "desc": "Interface para explorar versões históricas do mosaico World Imagery e comparar mudanças visíveis no território. Complementa a inspeção manual de áreas de obras e imóveis. A data de publicação do mosaico não é a data de captura da imagem; verificar os metadados locais, resolução, estação e cobertura antes de datar uma mudança. Imagens não comprovam propriedade nem regularidade de empreendimento.",
    "discoveredVia": [
      "Esri Living Atlas"
    ],
    "discoveryUrl": "https://doc.arcgis.com/en/imagery/workflows/tutorials/creating-an-image-visit-app.htm"
  },
  {
    "id": "arbiter",
    "name": "Arbiter",
    "kind": "monitoramento de narrativas e desinformação",
    "url": "https://arbiter.simppl.org/",
    "desc": "Permite definir um tema em linguagem natural e analisar publicações sociais em escala para agrupar narrativas, extrair alegações, sinalizar contas coordenadas, comparar plataformas e acompanhar tendências. Está em fase de testes com redações e depende de APIs, dumps acadêmicos e provedores externos; limites de volume, cobertura e acesso variam por plataforma, e os resultados automatizados exigem revisão humana.",
    "discoveryUrl": "https://mailchi.mp/gijn/gijc27-website-launched-investigating-war-crimes-which-newsroom-personality-are-you?e=0695d2d4f8"
  },
  {
    "id": "detector-bbt",
    "name": "Detector BBT",
    "kind": "monitoramento legislativo e eleitoral",
    "url": "https://bancadadasbigtechs.org/",
    "desc": "Permite buscar e filtrar deputados e senadores por partido, UF, Casa, eleição e posição em pautas de regulação digital, abrindo os registros e suas fontes. A pontuação combina votos, autoria, relatoria, emendas e declarações públicas; a base é colaborativa e atualizada, votações simbólicas podem não ter registro nominal e toda classificação deve ser conferida nos documentos oficiais da Câmara e do Senado.",
    "discoveryUrl": "https://newsletter.ctrlz.org.br/p/o-seu-candidato-e-da-bancada-das"
  },
  {
    "id": "datawrapper",
    "name": "Datawrapper",
    "kind": "visualização",
    "url": "https://www.datawrapper.de/",
    "desc": "Criação de gráficos, mapas e tabelas para publicação."
  },
  {
    "id": "react-simple-maps",
    "name": "React Simple Maps",
    "kind": "biblioteca de mapas",
    "url": "https://www.react-simple-maps.io/",
    "desc": "Componentes SVG para mapas em React; requer arquivos geográficos próprios e implementação no frontend.",
    "discoveredVia": [
      "Quantum of Sollazzo"
    ],
    "discoveryUrl": "https://buttondown.com/puntofisso/archive/676-quantum-of-sollazzo/"
  },
  {
    "id": "geowhisperer",
    "name": "GeoWhisperer",
    "kind": "OSINT geoespacial",
    "url": "https://www.geowhisperer.org/",
    "desc": "Compara imagens datadas do Esri World Imagery Wayback, executa checagens mecânicas de resolução, estação e intervalo e gera relatório ou vídeo das mudanças. A cobertura depende das imagens que a Esri publicou; resultados de IA precisam ser confirmados visualmente.",
    "discoveredVia": [
      "Indicator"
    ],
    "discoveryUrl": "https://indicator.media/p/briefing-uk-s-new-anti-disinfo-unit"
  },
  {
    "id": "digga",
    "name": "digga",
    "kind": "pesquisa de domínios",
    "url": "https://digga.dev/",
    "desc": "Ferramenta gratuita e open source para DNS, RDAP/WHOIS, subdomínios, IP/ASN, autenticação de e-mail e certificados SSL/TLS; a enumeração de subdomínios usa fontes públicas passivas.",
    "discoveredVia": [
      "Indicator"
    ],
    "discoveryUrl": "https://indicator.media/p/briefing-uk-s-new-anti-disinfo-unit"
  },
  {
    "id": "decryptads",
    "name": "DecryptAds",
    "kind": "investigação de publicidade digital",
    "url": "https://decryptads.com/",
    "desc": "Mapeia cadeias de publicidade programática com arquivos públicos como ads.txt, app-ads.txt e sellers.json, permitindo investigar parceiros, contas compartilhadas, mudanças e relações societárias.",
    "discoveredVia": [
      "Indicator"
    ],
    "discoveryUrl": "https://indicator.media/p/briefing-uk-s-new-anti-disinfo-unit"
  },
  {
    "id": "agenda-transparente",
    "name": "Agenda Transparente",
    "kind": "monitoramento de agendas públicas",
    "url": "https://agendas.fiquemsabendo.com.br/",
    "desc": "Pesquisa compromissos de autoridades por pessoa, órgão, período e palavra-chave e permite baixar resultados em CSV. A cobertura depende do que os governos publicam; uma reunião com várias autoridades pode gerar linhas repetidas, e nomes de órgãos ou empresas exigem padronização antes da análise.",
    "discoveryUrl": "https://news.fiquemsabendo.com.br/p/el-nino-na-agenda-do-governo-federal"
  },
  {
    "id": "google-pinpoint",
    "name": "Google Pinpoint",
    "kind": "pesquisa e análise documental",
    "url": "https://journaliststudio.google.com/pinpoint/about/pt-BR_br/",
    "desc": "Pesquisa grandes coleções de PDFs, imagens, e-mails, áudio e vídeo com OCR, transcrição, entidades e recursos de IA. Exige Conta Google; resultados automáticos precisam de conferência. Documentos são privados por padrão, mas comandos e respostas da IA generativa podem integrar amostras revisadas por humanos, portanto não inclua dados pessoais nos prompts e avalie o sigilo antes de enviar materiais sensíveis.",
    "discoveredVia": [
      "Google Journalist Studio"
    ],
    "discoveryUrl": "https://support.google.com/pinpoint/answer/17007004?hl=pt-BR"
  },
  {
    "id": "occrp-aleph-pro",
    "name": "OCCRP Aleph Pro",
    "kind": "investigação societária e documental",
    "url": "https://aleph.occrp.org/",
    "desc": "Pesquisa pessoas, empresas, documentos, vazamentos e bases públicas; permite OCR, cruzamento de nomes, relações e espaços de investigação. Parte do acervo é protegida, o cadastro avançado passa por revisão manual e exige 2FA, e todo resultado deve ser confirmado na fonte original.",
    "discoveredVia": [
      "OCCRP"
    ],
    "discoveryUrl": "https://docs.aleph.occrp.org/"
  }
];
