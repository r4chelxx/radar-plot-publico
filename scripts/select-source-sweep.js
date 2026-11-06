'use strict';

function selectSourceSweep(sources, options={}) {
  const unique = Array.isArray(sources) ? sources : [];
  const configuredLimit = options.limit;
  const limit = configuredLimit !== undefined && configuredLimit !== null && String(configuredLimit).toLowerCase() !== 'all'
    ? Math.max(1, Math.floor(Number(configuredLimit) || 1))
    : Math.max(1, unique.length);
  const daily = unique.filter(source => source.cadence === 'diária');
  const rotating = unique.filter(source => source.cadence !== 'diária');
  const batchCount = Math.max(1, Math.ceil(rotating.length / limit));
  const now = options.now instanceof Date ? options.now.getTime() : Number(options.now ?? Date.now());
  const batchIndex = batchCount === 1 ? 0 : Math.floor(now / 86400000) % batchCount;
  const selected = rotating.slice(batchIndex * limit, (batchIndex + 1) * limit);
  const selectedSources = [...new Map([...daily, ...selected].map(source => [source.url, source])).values()];
  return {limit, daily, rotating, selected, selectedSources, batchCount, batchIndex};
}

module.exports = {selectSourceSweep};
