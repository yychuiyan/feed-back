import {extensions, toMarkdown} from '../scripts/records.mjs';
const MAX_FILES=5, MAX_SIZE=10*1024*1024, MAX_REQUEST=MAX_SIZE+128*1024;
class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
function base64(bytes){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
export async function github(env,path,method='GET',data,fetcher=fetch){
  const response=await fetcher(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/${path}`,{method,headers:{Authorization:`Bearer ${env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','User-Agent':'feed-back-api','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  if(!response.ok)throw new HttpError(response.status===409||response.status===422?409:502,'反馈保存失败，请稍后重试。');
  return response.json();
}
export async function saveRecord(env,record,uploads,fetcher=fetch){
  const call=(path,method,data)=>github(env,path,method,data,fetcher);
  const entries=[];
  for(const upload of uploads){const blob=await call('git/blobs','POST',{content:base64(new Uint8Array(await upload.file.arrayBuffer())),encoding:'base64'});entries.push({path:upload.path,mode:'100644',type:'blob',sha:blob.sha});}
  const md=await call('git/blobs','POST',{content:toMarkdown(record),encoding:'utf-8'});
  entries.push({path:`feedback/${record.id}.md`,mode:'100644',type:'blob',sha:md.sha});
  const branch=env.GITHUB_BRANCH||'main';
  for(let attempt=0;attempt<3;attempt++){
    const ref=await call(`git/ref/heads/${branch}`);
    const parent=await call(`git/commits/${ref.object.sha}`);
    const tree=await call('git/trees','POST',{base_tree:parent.tree.sha,tree:entries});
    const commit=await call('git/commits','POST',{message:`feedback: ${record.id}`,tree:tree.sha,parents:[ref.object.sha]});
    try{await call(`git/refs/heads/${branch}`,'PATCH',{sha:commit.sha,force:false});return record;}
    catch(error){if(error.status!==409||attempt===2)throw error;}
  }
}
export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin')||'';
    const origins=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(origins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
    const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
    const url=new URL(request.url);
    if(url.pathname==='/health'&&request.method==='GET')return json({ready:Boolean(env.GITHUB_TOKEN&&env.GITHUB_REPOSITORY)});
    if(url.pathname!=='/feedback')return json({error:'页面不存在'},404);
    if(!origins.includes(origin))return json({error:'不允许从此站点提交'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'}});
    if(request.method!=='POST')return json({error:'仅支持提交反馈'},405);
    try{
      if(!env.GITHUB_TOKEN||!env.SUBMISSION_LIMITER)throw new HttpError(503,'匿名提交服务尚未配置完成，请稍后再试。');
      const {success}=await env.SUBMISSION_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
      if(!success)throw new HttpError(429,'提交较频繁，请一分钟后再试。');
      if(!request.headers.get('Content-Type')?.startsWith('multipart/form-data'))throw new HttpError(415,'提交格式不正确');
      if(Number(request.headers.get('Content-Length'))>MAX_REQUEST)throw new HttpError(413,'附件总大小不能超过 10 MB');
      const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'提交内容为空');
      const chunks=[];let size=0;
      while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_REQUEST){await reader.cancel();throw new HttpError(413,'附件总大小不能超过 10 MB');}chunks.push(value);}
      const form=await new Response(new Blob(chunks),{headers:{'Content-Type':request.headers.get('Content-Type')}}).formData();
      if(form.get('website'))throw new HttpError(400,'提交内容无效');
      const description=form.get('description'),type=form.get('type');
      if(typeof description!=='string'||!description.trim()||description.length>5000)throw new HttpError(400,'请填写 1–5000 个字符的反馈描述');
      if(!['需求','问题'].includes(type))throw new HttpError(400,'请选择需求或问题');
      const nickname=form.get('nickname')??'';
      if(typeof nickname!=='string'||nickname.trim().length>20||/[\u0000-\u001f\u007f]/.test(nickname))throw new HttpError(400,'昵称最多 20 个字符，不能包含换行等控制字符');
      const visitorId=form.get('visitorId')||crypto.randomUUID();
      if(typeof visitorId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId))throw new HttpError(400,'访客编号格式不正确，请刷新页面后重试');
      const files=form.getAll('attachments');
      if(files.length>MAX_FILES||files.some(f=>typeof f==='string'))throw new HttpError(400,'最多上传 5 个附件');
      if(files.reduce((sum,f)=>sum+f.size,0)>MAX_SIZE)throw new HttpError(413,'附件总大小不能超过 10 MB');
      const id=`fb-${crypto.randomUUID()}`;
      const uploads=files.map((file,index)=>{const ext=file.name.split('.').pop().toLowerCase();if(!extensions.has(ext))throw new HttpError(400,'附件格式不支持');return {file,path:`attachments/${id}/${index+1}.${ext}`};});
      const record={id,type,nickname:nickname.trim(),visitorId,status:'待处理',reason:'',createdAt:new Date().toISOString(),description:description.trim(),attachments:uploads.map(u=>({name:u.file.name.slice(0,200),path:u.path,size:u.file.size}))};
      await saveRecord(env,record,uploads);
      return json(record,201);
    }catch(error){return json({error:error instanceof HttpError?error.message:'提交失败，请稍后重试。'},error instanceof HttpError?error.status:500);}
  }
};
