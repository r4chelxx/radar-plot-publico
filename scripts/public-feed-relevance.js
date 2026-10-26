// Shared relevance policy for public RSS and homepage discovery.
// A source can be accessible without providing relevant candidates.
const relevant=/(?:grant|fellowship|scholarship|funding|call for|open call|job opening|tool|dataset|database|open data|bolsa|edital|financiamento|ferramenta|research)/i;
function isRelevant(title){return typeof title==='string'&&title.trim().length>=12&&relevant.test(title)}
module.exports={isRelevant};
