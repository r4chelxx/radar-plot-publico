'use strict';

// A direct press/article path is strong evidence. "newsroom" alone is not:
// usable products can serve newsrooms without being editorial pages.
const editorialPath = /\/(?:press-releases?|articles?|blog|posts?)(?:\/|$)/i;
const articleStructuredData = /["']@type["']\s*:\s*["'](?:NewsArticle|Article|BlogPosting|Report|ScholarlyArticle)["']/i;
const editorialReportHeadline = /\\b(?:news|research) report\\s+20\\d{2}\\b/i;
const editorialStoryData = /globalContent\s*=\s*\{[\s\S]{0,1400}?["']type["']\s*:\s*["']story["'][\s\S]{0,300}?["']subtype["']\s*:\s*["']news["']/i;

function isEditorialPage(record, proof = {}) {
  const url = String(record?.url || record?.rules || '');
  try {
    const parsed = new URL(url);
    if (editorialPath.test(decodeURIComponent(parsed.pathname))) return true;
  } catch {}

  const evidence = String(proof?.evidence || '');
  if (articleStructuredData.test(evidence) || editorialStoryData.test(evidence) || editorialReportHeadline.test(title + ' ' + evidence)) return true;

  const newsroomPressReleaseNav = /newsroom\s*(?:\||›|»|-)\s*press releases?|press releases?\s*(?:\||›|»|-)\s*newsroom/i.test(evidence);
  const title = String(record?.name || record?.title || '').trim();
  const headlineAppears = title.length >= 20 && evidence.toLowerCase().includes(title.toLowerCase());
  const publishedDate = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/i.test(evidence);
  return newsroomPressReleaseNav && headlineAppears && publishedDate;
}

function hasDocumentedToolFunction(value) {
  return /(?:feature|function|capabilit|funcional|permite|provides|supports|\bAPIs?\b|data formats|documentation|documenta|generator|generates?|writes?|creates?|builds?|theme editor|programming language|statistical computing|statistical analysis|data analytics|business intelligence|query language|file,? track and share public records requests|browser automation tool|graphics framework|javascript 3d library)/i.test(String(value || ''));
}

module.exports = { hasDocumentedToolFunction, isEditorialPage };
