export function normalizeQuery(value) {
  return String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('zh-CN');
}

export function matchesQuery(record, query) {
  const terms = normalizeQuery(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  if (!record || typeof record !== 'object') return false;
  const values = [
    record.id,
    record.nickname,
    record.site,
    record.type,
    record.status,
    record.reason,
    record.description,
    record.visitorId,
    record.createdAt,
    ...(Array.isArray(record.attachments) ? record.attachments.map(file => file?.name) : [])
  ].map(normalizeQuery);
  return terms.every(term => values.some(value => value.includes(term)));
}
