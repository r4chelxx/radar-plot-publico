'use strict';

function hasDocumentedToolFunction(value) {
  return /(?:feature|function|capabilit|funcional|permite|provides|supports|\bAPIs?\b|data formats|documentation|documenta|generator|generates?|writes?|creates?|builds?|theme editor|programming language|statistical computing|statistical analysis|data analytics|business intelligence|query language|file,? track and share public records requests|browser automation tool|graphics framework|javascript 3d library)/i.test(String(value || ''));
}

module.exports = { hasDocumentedToolFunction };
