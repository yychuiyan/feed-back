export const sites = ['拾萤','寻巷','LanternHarness','炊烟小站','线路检测'];
export const types = ['需求','问题','其他'];
export const statuses = ['待处理', '已解决', '无需处理'];
export const extensions = new Set(['png','jpg','jpeg','webp','gif','pdf','txt','log','zip']);
export function validateRecord(record) {
  if (!/^[a-zA-Z0-9-]+$/.test(record.id ?? '')) throw new Error('反馈编号不合法');
  if (record.site !== undefined && !sites.includes(record.site)) throw new Error('站点不合法');
  if (!types.includes(record.type)) throw new Error('请选择需求、问题或其他');
  if (typeof record.description !== 'string' || !record.description.trim() || record.description.length > 5000) throw new Error('反馈描述需为 1–5000 个字符');
  if (record.nickname !== undefined && (typeof record.nickname !== 'string' || record.nickname.length > 20 || /[\u0000-\u001f\u007f]/.test(record.nickname))) throw new Error('昵称不合法');
  if (record.visitorId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.visitorId)) throw new Error('访客编号不合法');
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
  const metadata=JSON.parse(match[1]);
  if(metadata.site==='个人博客')metadata.site='炊烟小站';
  return validateRecord({...metadata, description:match[2].trim()});
}
