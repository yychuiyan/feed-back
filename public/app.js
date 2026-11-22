const config = window.FEEDBACK_CONFIG;
const $ = selector => document.querySelector(selector);
let records = [], files = [], activeStatus = '全部', busy = false;
const maxBytes = 10 * 1024 * 1024;
const allowed = /\.(png|jpe?g|webp|gif|pdf|txt|log|zip)$/i;
function message(text, kind='error') { $('#form-message').textContent=text; $('#form-message').className=`form-message ${kind}`; }
function element(tag, className, text) { const node=document.createElement(tag); if(className)node.className=className; if(text!==undefined)node.textContent=text; return node; }
function showFiles() {
  $('#file-list').replaceChildren(...files.map((file,index)=>{
    const li=element('li'); const remove=element('button','remove-file','×'); remove.type='button'; remove.disabled=busy; remove.setAttribute('aria-label',`移除 ${file.name}`); remove.onclick=()=>{files.splice(index,1);showFiles();};
    li.append(element('span','file-name',file.name),element('span','file-size',`${(file.size/1024).toFixed(0)} KB`),remove);return li;
  }));
}
function addFiles(incoming) {
  if(busy)return;
  const next=[...files,...incoming];
  if(next.length>5)return message('最多上传 5 个附件，请移除部分文件后重试。');
  if(next.some(f=>!allowed.test(f.name)))return message('请选择图片、PDF、TXT、日志或 ZIP 文件。');
  if(next.reduce((n,f)=>n+f.size,0)>maxBytes)return message('附件总大小不能超过 10 MB。');
  files=next;showFiles();message('');
}
$('#attachments').addEventListener('change',event=>{addFiles([...event.target.files]);event.target.value='';});
const drop=$('.upload-area');
for(const name of ['dragenter','dragover'])drop.addEventListener(name,event=>{event.preventDefault();drop.classList.add('dragging');});
for(const name of ['dragleave','drop'])drop.addEventListener(name,event=>{event.preventDefault();drop.classList.remove('dragging');});
drop.addEventListener('drop',event=>addFiles([...event.dataTransfer.files]));
$('#description').addEventListener('input',()=>$('#description-count').textContent=`${$('#description').value.length} / 5000`);
function render() {
  $('#total-count').textContent=records.length;
  const visible=records.filter(r=>activeStatus==='全部'||r.status===activeStatus).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  if(!visible.length){const empty=element('div','empty');empty.append(element('div','empty-icon','≡'),element('strong','',records.length?'暂时没有这类反馈':'还没有反馈，来写下第一条吧'),element('p','',records.length?'切换其他处理结果，查看反馈记录。':'你的问题和建议，会在这里留下记录。'));$('#feedback-list').replaceChildren(empty);return;}
  $('#feedback-list').replaceChildren(...visible.map(record=>{
    const card=element('article','feedback-card'),top=element('div','record-top'),meta=element('div','record-meta');
    const date=new Date(record.createdAt);const time=element('time','',new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date));time.dateTime=record.createdAt;
    meta.append(element('span',`type-badge ${record.type==='问题'?'problem':''}`,record.type),time);
    top.append(meta,element('span',`status ${{'待处理':'pending','已解决':'resolved','无需处理':'declined'}[record.status]||'pending'}`,record.status));
    card.append(top,element('p','record-description',record.description));
    if(record.status==='无需处理')card.append(element('div','reason',`无需处理原因：${record.reason}`));
    if(record.attachments?.length){const attachments=element('div','record-files');for(const file of record.attachments){if(!/^attachments\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/.test(file.path))continue;const a=element('a','',`附件 · ${file.name}`);a.href=`https://github.com/${config.repository}/raw/refs/heads/main/${file.path}`;a.target='_blank';a.rel='noopener noreferrer';attachments.append(a);}card.append(attachments);}
    return card;
  }));
}
async function load() {
  $('#refresh').disabled=true;$('#list-message').textContent='正在加载反馈…';
  try {
    const url=`./feedback.json?t=${Date.now()}`;
    const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error();
    const data=await response.json();if(!Array.isArray(data))throw Error();records=[...data,...records.filter(r=>!data.some(item=>item.id===r.id))];render();$('#list-message').textContent='';
  } catch {$('#list-message').textContent='反馈列表加载失败，请点击“刷新列表”重试。';}
  finally{$('#refresh').disabled=false;}
}
for(const button of document.querySelectorAll('.filter'))button.onclick=()=>{activeStatus=button.dataset.status;for(const item of document.querySelectorAll('.filter')){item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));}render();};
$('#refresh').onclick=load;
$('#feedback-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  if(!$('#description').value.trim())return message('请先填写反馈描述。');
  if(!config.apiUrl)return message('匿名提交服务尚未启用，请稍后再试。已填写的内容会保留在当前页面。');
  busy=true;$('#submit-button').disabled=true;$('#submit-button').textContent='正在提交…';showFiles();message('');
  const data=new FormData(event.target);data.delete('attachments');for(const file of files)data.append('attachments',file);
  try {
    const response=await fetch(`${config.apiUrl.replace(/\/$/,'')}/feedback`,{method:'POST',body:data});
    const result=await response.json();if(!response.ok)throw Error(result.error||'提交失败，请稍后重试。');
    records=[result,...records.filter(r=>r.id!==result.id)];activeStatus='全部';for(const item of document.querySelectorAll('.filter')){const selected=item.dataset.status==='全部';item.classList.toggle('active',selected);item.setAttribute('aria-pressed',String(selected));}
    render();event.target.reset();files=[];$('#description-count').textContent='0 / 5000';message('反馈已提交，当前状态为“待处理”。','success');
  } catch(error) {message(error.message==='Failed to fetch'?'网络连接失败，请保留内容并重试。':error.message);}
  finally {busy=false;$('#submit-button').disabled=false;$('#submit-button').textContent='提交反馈';showFiles();}
});
render();load();
