export const statuses = ['待处理', '已解决', '无需处理'];
export const extensions = new Set(['png','jpg','jpeg','webp','gif','pdf','txt','log','zip']);
export function validateRecord(record) {
  if (!/^[a-zA-Z0-9-]+$/.test(record.id ?? '')) throw new Error('反馈编号不合法');
  if (!['需求','问题'].includes(record.type)) throw new Error('请选择需求或问题');
  if (typeof record.description !== 'string' || !record.description.trim() || record.description.length > 5000) throw new Error('反馈描述需为 1–5000 个字符');
  if (!statuses.includes(record.status)) throw new Error('处理结果不合法');
  if (record.status === '无需处理' && !record.reason?.trim()) throw new Error('无需处理必须填写原因');
  if (!Number.isFinite(Date.parse(record.createdAt))) throw new Error('提交时间不合法');
  if (!Array.isArray(record.attachments) || record.attachments.length > 5) throw new Error('附件不合法');
  for (const file of record.attachments) {
    if (typeof file.name !== 'string' || !new RegExp(`^attachments/${record.id}/[a-zA-Z0-9._-]+$`).test(file.path)) throw new Error('附件路径不合法');
  }
  return record;
}
export function toMarkdown(record) {
  validateRecord(record);
  const {description, ...metadata} = record;
  return `---\n${JSON.stringify(metadata, null, 2)}\n---\n\n${description.trim()}\n`;
}
export function fromMarkdown(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Markdown 缺少元数据');
  return validateRecord({...JSON.parse(match[1]), description:match[2].trim()});
}
