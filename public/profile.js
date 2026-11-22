const key = 'feedback.visitor.v1';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function rememberProfile(storage, profile) {
  try {storage.setItem(key, JSON.stringify({visitorId:profile.visitorId,nickname:profile.nickname}));return true;} catch {return false;}
}
export function loadProfile(storage, createId) {
  let saved;
  try {saved=JSON.parse(storage.getItem(key));} catch {}
  const profile={visitorId:uuid.test(saved?.visitorId ?? '')?saved.visitorId:createId(),nickname:typeof saved?.nickname==='string'?saved.nickname.slice(0,20):''};
  return {...profile,persistent:rememberProfile(storage,profile)};
}
