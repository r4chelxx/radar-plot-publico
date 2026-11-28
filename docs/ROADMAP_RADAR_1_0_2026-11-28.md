# Radar PLOT 1.0 — diagnóstico do funil e roadmap (28/11/2026)

## Resultado executivo

O Radar encontra muito mais links do que consegue transformar em registros publicáveis porque os contadores de descoberta incluem URLs repetidas e páginas ainda sem valor editorial confirmado. Mesmo depois de reduzir duplicatas, o fluxo examina um lote limitado; parte das páginas falha no acesso; e as que carregam precisam fornecer evidência específica para sua categoria. A última publicação diária terminou com **0 oportunidades, 0 ferramentas e 0 bases/dados novos**. A meta de 2 por categoria não foi atingida.

A validação não deve ser afrouxada. A evidência da execução encontrou, porém, falhas reais de extração: uma página oficial de fellowship continha prazo e elegibilidade explícitos, mas o parser não entendeu a formulação em inglês. Essa correção está integrada, com testes, e será conferida em uma execução real.

## Cadeia observada

| Etapa | Métrica | O que significa |
|---|---:|---|
| Links brutos extraídos | 3.307 | Soma antes da deduplicação e da triagem editorial |
| URLs após deduplicação | 1.998 | 1.309 repetições removidas; não são 1.998 oportunidades novas |
| Links ainda sem verificação editorial | 1.864 | Candidatos a examinar, não itens elegíveis para publicação |
| Candidatos na fila histórica | 5.020 | Mistura de registros antigos e URLs recorrentes de várias categorias |
| Páginas inspecionadas na execução | 480 | Limite operacional por execução; 478 eram históricas e 2 novas |
| Lote elegível para rechecagem | 126 | A seleção completou o lote com rotação de itens ainda dentro do intervalo de rechecagem |
| Inspeções com resposta HTML | 336 (70%) | Única parte do lote em que o parser conseguiu analisar uma página HTML |
| Inspeções sem HTML aproveitável | 144 (30%) | 77 erros HTTP, 53 falhas de rede, 4 URLs bloqueadas e 10 respostas não HTML |
| Aprovações automáticas | 0 de 480 | Nenhuma ficha passou pela evidência e validação independentes |
| Publicações novas no ciclo diário posterior | 0 / 0 / 0 | O deploy ocorreu, mas não houve acréscimos no catálogo |

O relatório de histórico registrou 3.676 URLs vistas na execução: 3.673 recorrentes e 3 inéditas no histórico. “Inédita” significa apenas que a URL não estava na memória persistida; não confirma oportunidade nova, atual ou publicável. A diferença entre 3.307 links brutos e 1.998 URLs após triagem mostra por que a contagem de links pode parecer alta sem representar novos recursos.

A fila de 5.020 contém 747 candidatos classificados como oportunidades, 216 como dados/bases, 285 como ferramentas e 3.810 ainda sem categoria específica. O sistema prioriza as três categorias do catálogo, mas não consegue tratar a categoria “não classificado” como item publicável.

## Motivos de bloqueio observados

Os 480 bloqueios são contagens sobrepostas: uma ficha pode falhar em mais de um requisito.

- **Oportunidades:** 99 sem prazo futuro/fluxo contínuo confirmado, 99 sem elegibilidade expressa, 66 sem escopo jornalístico claro e 52 sem sinal suficiente de chamada. Uma página oficial dizia que jornalistas em situação de risco no exterior podiam se candidatar a uma fellowship de 2027; o extrator identificou o prazo, mas não a elegibilidade nem a organização responsável.
- **Dados e bases:** 60 sem organização extraída; 20 sem prova de download/API/acesso direto; 13 sem formato identificável; 7 sem cobertura temporal ou geográfica. Algumas URLs eram páginas de catálogo, diretórios ou portais, não a ficha individual do conjunto.
- **Ferramentas:** 15 sem função documentada na página inspecionada. Outras páginas falharam no acesso ou não tinham nome, função, descrição e URL do produto comprovados.
- **Acesso:** entre os 77 erros HTTP, houve 26 respostas 403 e 50 respostas 404. O estado 403 pode ser bloqueio automatizado, não prova de link inválido; 404 persistente pode indicar link antigo, redirecionamento ruim ou item removido. Hoje isso reduz o material que chega à extração.

Há casos em que a validação corretamente impede publicações — notícia, página inicial, evento, diretório, item encerrado ou conjunto sem prova de acesso. A correção é recuperar fatos explícitos de páginas oficiais e reduzir falhas de acesso, preservando o bloqueio quando a fonte não comprovar o item.

## Por que os achados não viram publicações

1. **Descoberta conta links, não itens:** fontes monitoradas repetem URLs, apontam para páginas iniciais e incluem links de navegação. Deduplicar resolve apenas parte; ainda é preciso separar uma chamada, base ou ferramenta real.
2. **A fila contém muito histórico:** na execução observada, 478 dos 480 itens auditados eram históricos. Foram só 2 novas URLs inspecionadas, embora o histórico tenha visto 3 URLs inéditas.
3. **O acesso falha em 30% do lote:** páginas bloqueadas ou indisponíveis não fornecem conteúdo confiável para as fichas.
4. **Os fatos não são extraídos de forma uniforme:** o parser reconhecia algumas formas de prazo/elegibilidade, mas perdia outras. A página pode conter o fato e ainda assim faltar o campo estruturado na ficha.
5. **Os campos variam por categoria:** uma base precisa comprovar qual conjunto é, quem o publica, cobertura, formato e acesso; uma ferramenta precisa comprovar produto e função; uma oportunidade precisa comprovar chamada, organização, elegibilidade e prazo/fluxo contínuo.
6. **O publisher estava operacional, sem material novo aprovado:** uma rodada recebeu 4 rascunhos; 3 tinham campos obrigatórios ausentes e o item aprovado já existia no catálogo. A rotina de deploy pode concluir com sucesso sem publicar item novo.

## Correções integradas nesta rodada

- **PR #522:** remove busca web, inspeção de páginas e persistência da fila dos checks de pull request. Esses checks agora executam validações e testes sem consumir uma varredura real. Também adiciona contagem dos campos ausentes por categoria nos relatórios.
- **PR #524:** corrige a leitura de elegibilidade explícita como “journalists at risk from abroad can apply”; remove menus, cabeçalhos, rodapés, barras laterais, scripts e estilos do texto usado para extrair fatos; reconhece organizações nomeadas no conteúdo principal; usa o dia local da Bahia para limites de datas; rejeita datas impossíveis. O gate e os critérios de publicação permanecem iguais.
- **PR #524:** adiciona matriz de auditoria por categoria, status da página e motivo de bloqueio para que o relatório deixe de somar todos os problemas em um único total.

Os testes de descoberta, validação de dados e navegador passaram antes da integração. A execução de descoberta no push da correção está em andamento; por isso ainda não há evidência de que o parser atualizado aumentou o número de registros aprovados ou publicados.

## Próximas prioridades

### P0 — confirmar a extração corrigida em execução real
1. Conferir o resultado de descoberta iniciado pelo merge do PR #524.
2. Verificar se a chamada de fellowship do exemplo é estruturada corretamente e passa todos os gates, incluindo duplicidade, URL oficial e ficha completa.
3. Usar a nova matriz por categoria para escolher exemplos reais de bloqueio de dados e ferramentas e corrigir extração apenas onde a fonte primária comprove o campo.

### P1 — recuperar conteúdo de páginas inacessíveis
1. Tratar 403/429 como inconclusivos e buscar alternativas oficiais (feeds, APIs, páginas espelho oficiais e links de candidatura).
2. Revalidar 404 antes de arquivar, preservando a distinção entre item removido e URL de descoberta desatualizada.
3. Registrar por candidato a URL de descoberta, URL final, tentativas, erro e fonte alternativa encontrada.

### P1 — aumentar achados novos com qualidade
1. Abrir fontes globais e buscas temáticas complementares, priorizando páginas específicas de chamadas, produtos e bases em vez de listas genéricas.
2. Acompanhar URLs inéditas por categoria, e não somente volume bruto de links. Um ciclo que encontra milhares de repetições não substitui uma pesquisa nova.
3. Manter lote alto de inspeção e medir o custo por página acessível e por ficha estruturada. Aumentar o limite sem corrigir 403/404 e extração só amplia o backlog processado sem resolver a publicação.

### P2 — manter a meta verificável
A cada dia, contar **novos IDs incorporados ao catálogo** em oportunidades, ferramentas e dados/bases, confirmar o changelog e o deploy e abrir/atualizar a issue de déficit quando qualquer categoria ficar abaixo de 2. “Workflow success”, aprovação de item duplicado e atualização de status não contam como publicação nova.

## Critério de conclusão

O Radar só será declarado plenamente funcional depois que um ciclo agendado de ponta a ponta encontrar, verificar e publicar 2 novos itens em cada categoria, confirmar esses seis ou mais novos registros no catálogo e changelog públicos e demonstrar que não são páginas genéricas, duplicatas, itens encerrados ou itens classificados incorretamente.
