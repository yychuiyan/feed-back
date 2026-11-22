import {loadProfile, rememberProfile} from './profile.js';
const config = window.FEEDBACK_CONFIG;
const $ = selector => document.querySelector(selector);
let records = [], files = [], activeStatus = '全部', busy = false;
const maxBytes = 10 * 1024 * 1024;
const allowed = /\.(png|jpe?g|webp|gif|pdf|txt|log|zip)$/i;
let storage;
try {storage=window.localStorage;} catch {}
const profile=loadProfile(storage,()=>crypto.randomUUID());
$('#nickname').value=profile.nickname;
function saveNickname() {
  profile.nickname=$('#nickname').value;
  profile.persistent=rememberProfile(storage,profile);
  if(!profile.persistent)$('#nickname-help').textContent='浏览器无法保存昵称，本次仍可提交；下次需要重新填写。';
}
saveNickname();
$('#nickname').addEventListener('input',saveNickname);
function message(text, kind='error') { $('#form-message').textContent=text; $('#form-message').className=`form-message ${kind}`; }
function element(tag, className, text) { const node=document.createElement(tag); if(className)node.className=className; if(text!==undefined)node.textContent=text; return node; }
const siteItems=[
  {name:'拾萤',icon:'firepick.png'},
  {name:'寻巷',icon:'xunxiang.png'},
  {name:'LanternHarness',icon:'lantern.png'},
  {name:'炊烟小站',icon:'blog.svg'},
  {name:'线路检测',icon:'network.svg'}
];
const typeItems=[
  {name:'需求',symbol:'✦',tone:'type-requirement'},
  {name:'问题',symbol:'!',tone:'type-problem'},
  {name:'其他',symbol:'⋯',tone:'type-other'}
];
function setupPicker(prefix,items){
  const container=$(`#${prefix}-select`),trigger=$(`#${prefix}-trigger`),menu=$(`#${prefix}-options`),input=$(`#${prefix}`);
  let active=0,typeahead='',timer;
  function iconFor(item){
    const icon=element(item.icon?'img':'span',`site-icon ${item.icon?'':`type-icon ${item.tone}`}`);
    if(item.icon){icon.src=`./site-icons/${item.icon}`;icon.alt='';icon.width=icon.height=32;}else{icon.textContent=item.symbol;icon.setAttribute('aria-hidden','true');}
    return icon;
  }
  function activate(index,scroll=true){
    active=(index+items.length)%items.length;
    for(const [i,option] of [...menu.children].entries())option.classList.toggle('is-active',i===active);
    trigger.setAttribute('aria-activedescendant',`${prefix}-option-${active}`);
    if(scroll)menu.children[active].scrollIntoView({block:'nearest'});
  }
  function open(){
    menu.hidden=false;trigger.setAttribute('aria-expanded','true');
    const rect=trigger.getBoundingClientRect(),below=innerHeight-rect.bottom-16,above=rect.top-16;
    const openUp=below<Math.min(280,menu.scrollHeight)&&above>below;
    container.classList.toggle('opens-up',openUp);
    menu.style.maxHeight=`${Math.min(320,Math.max(120,openUp?above:below))}px`;
    activate(Math.max(0,items.findIndex(item=>item.name===input.value)));
  }
  function close(){menu.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');clearTimeout(timer);typeahead='';}
  function select(index){
    const item=items[index];input.value=item.name;$(`#${prefix}-value`).textContent=item.name;trigger.title=item.name;
    const icon=iconFor(item);icon.id=`${prefix}-icon`;$(`#${prefix}-icon`).replaceWith(icon);
    for(const [i,option] of [...menu.children].entries())option.setAttribute('aria-selected',String(i===index));
  }
  for(const [index,item] of items.entries()){
    const option=element('div','site-option');option.id=`${prefix}-option-${index}`;
    option.setAttribute('role','option');option.setAttribute('aria-selected',String(index===0));
    const check=element('span','site-check','✓');check.setAttribute('aria-hidden','true');
    option.append(iconFor(item),element('span','site-option-name',item.name),check);menu.append(option);
    option.addEventListener('pointerdown',event=>event.preventDefault());
    option.onclick=()=>{select(index);close();trigger.focus();};
    option.addEventListener('pointermove',()=>activate(index,false));
  }
  trigger.onclick=()=>menu.hidden?open():close();
  trigger.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(event.key)){
      event.preventDefault();const wasOpen=!menu.hidden;if(!wasOpen)open();
      if(event.key==='Home')activate(0);
      else if(event.key==='End')activate(items.length-1);
      else if(wasOpen&&(event.key==='ArrowDown'||event.key==='ArrowUp'))activate(active+(event.key==='ArrowDown'?1:-1));
      else if(wasOpen&&(event.key==='Enter'||event.key===' ')){select(active);close();}
    }else if(event.key==='Escape'&&!menu.hidden){event.preventDefault();close();}
    else if(event.key==='Tab')close();
    else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();if(menu.hidden)open();typeahead+=event.key.toLowerCase();
      const match=items.findIndex(item=>item.name.toLowerCase().startsWith(typeahead));if(match>=0)activate(match);
      clearTimeout(timer);timer=setTimeout(()=>{typeahead='';},600);
    }
  });
  document.addEventListener('pointerdown',event=>{if(!container.contains(event.target))close();});
  trigger.addEventListener('blur',close);
  window.addEventListener('resize',close);
  $('#feedback-form').addEventListener('reset',()=>{select(0);close();});
}
setupPicker('site',siteItems);
setupPicker('type',typeItems);
const previewDialog=$('#attachment-preview');
let previewUrl, previewRequest, pdfTask;
function releasePreview() {
  previewRequest?.abort();previewRequest=undefined;
  if(pdfTask){void pdfTask.destroy().catch(()=>{});pdfTask=undefined;}
  $('#preview-content').replaceChildren();
  if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=undefined;
}
function closePreview(){previewDialog.close();releasePreview();}
$('#preview-close').onclick=closePreview;
previewDialog.addEventListener('close',releasePreview);
previewDialog.addEventListener('click',event=>{if(event.target===previewDialog)closePreview();});
async function previewPdf(blob,controller) {
  const pdfjs=await import('./pdfjs/pdf.js');
  if(controller.signal.aborted)return;
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('./pdfjs/pdf.worker.js',location.href).href;
  const data=new Uint8Array(await blob.arrayBuffer());
  if(controller.signal.aborted)return;
  const task=pdfjs.getDocument({data,isEvalSupported:false,cMapUrl:new URL('./pdfjs/cmaps/',location.href).href,cMapPacked:true,standardFontDataUrl:new URL('./pdfjs/standard_fonts/',location.href).href,wasmUrl:new URL('./pdfjs/wasm/',location.href).href});
  pdfTask=task;const pdf=await task.promise;if(controller.signal.aborted)return;
  const toolbar=element('div','pdf-toolbar'),previous=element('button','','上一页'),next=element('button','','下一页'),pageLabel=element('span');
  previous.type=next.type='button';toolbar.append(previous,pageLabel,next);
  const canvas=element('canvas','pdf-canvas');canvas.setAttribute('role','img');
  $('#preview-content').replaceChildren(toolbar,canvas);
  let pageNumber=1;
  async function drawPage(number){
    previous.disabled=next.disabled=true;
    try{
      const page=await pdf.getPage(number);if(controller.signal.aborted)return;
      const original=page.getViewport({scale:1});
      const width=Math.max(100,$('#preview-content').clientWidth-32);
      const viewport=page.getViewport({scale:Math.min(width/original.width,2)});
      const density=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.ceil(viewport.width*density);canvas.height=Math.ceil(viewport.height*density);
      canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;
      canvas.setAttribute('aria-label',`PDF 第 ${number} 页，共 ${pdf.numPages} 页`);
      await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[density,0,0,density,0,0]}).promise;
      if(controller.signal.aborted)return;
      pageNumber=number;pageLabel.textContent=`${pageNumber} / ${pdf.numPages}`;
      previous.disabled=pageNumber===1;next.disabled=pageNumber===pdf.numPages;
    }catch(error){if(!controller.signal.aborted)$('#preview-content').replaceChildren(element('p','preview-message','PDF 无法预览，请下载后查看。'));}
  }
  previous.onclick=()=>drawPage(pageNumber-1);next.onclick=()=>drawPage(pageNumber+1);
  await drawPage(1);
}
async function openPreview(file) {
  releasePreview();
  $('#preview-title').textContent=file.name;
  const download=$('#preview-download');
  download.href=file.path?`https://github.com/${config.repository}/raw/refs/heads/main/${file.path}`:'#';
  download.download=file.name;download.hidden=!file.path;
  $('#preview-content').append(element('p','preview-message','正在加载附件…'));
  if(!previewDialog.open)previewDialog.showModal();
  const controller=new AbortController();previewRequest=controller;
  const ext=(file.path||file.name).split('.').pop().toLowerCase();
  const imageTypes={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
  try {
    if(ext==='zip'&&file.path){$('#preview-content').replaceChildren(element('p','preview-message','ZIP 暂不支持在线预览，请下载后查看。'));return;}
    let blob;
    if(file.path){
      let response=await fetch(new URL(file.path,location.href),{signal:controller.signal,cache:'no-store'});
      if(!response.ok)response=await fetch(`https://raw.githubusercontent.com/${config.repository}/main/${file.path}`,{signal:controller.signal,cache:'no-store'});
      if(!response.ok)throw Error('附件暂时无法加载，请稍后重试或下载查看。');
      blob=await response.blob();
    }else blob=file;
    if(controller.signal.aborted)return;
    if(!file.path){previewUrl=URL.createObjectURL(new Blob([blob],{type:imageTypes[ext]||blob.type||'application/octet-stream'}));download.href=previewUrl;download.hidden=false;}
    $('#preview-content').replaceChildren();
    if(ext==='txt'||ext==='log'){
      const text=await blob.slice(0,200000).text();if(controller.signal.aborted)return;
      $('#preview-content').append(element('pre','preview-text',text));
      if(blob.size>200000)$('#preview-content').append(element('p','preview-message','当前仅预览前 200 KB，请下载查看完整内容。'));
    }else if(ext==='pdf'){
      await previewPdf(blob,controller);if(controller.signal.aborted)return;
    }else if(imageTypes[ext]){
      if(!previewUrl)previewUrl=URL.createObjectURL(new Blob([blob],{type:imageTypes[ext]}));
      const media=element('img','preview-image');media.alt=file.name;
      media.src=previewUrl;
      media.onerror=()=>{if(!controller.signal.aborted)$('#preview-content').replaceChildren(element('p','preview-message','当前浏览器无法显示此附件，请下载后查看。'));};
      $('#preview-content').append(media);
    }else $('#preview-content').append(element('p','preview-message','此文件暂不支持在线预览，请下载后查看。'));
  }catch(error){if(!controller.signal.aborted)$('#preview-content').replaceChildren(element('p','preview-message',error.message==='Failed to fetch'?'网络连接失败，请重试或下载附件。':error.message));}
}
function showFiles() {
  $('#file-list').replaceChildren(...files.map((file,index)=>{
    const li=element('li'); const remove=element('button','remove-file','×'); remove.type='button'; remove.disabled=busy; remove.setAttribute('aria-label',`移除 ${file.name}`); remove.onclick=()=>{files.splice(index,1);showFiles();};
    const preview=element('button','file-name file-preview-button',file.name);preview.type='button';preview.setAttribute('aria-label',`预览附件 ${file.name}`);preview.onclick=()=>openPreview(file);
    li.append(preview,element('span','file-size',`${(file.size/1024).toFixed(0)} KB`),remove);return li;
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
let activeIdPreview;
function closeIdPreview(){
  if(!activeIdPreview)return;
  activeIdPreview.bubble.hidden=true;activeIdPreview.button.setAttribute('aria-expanded','false');activeIdPreview.button.removeAttribute('aria-describedby');activeIdPreview=undefined;
}
document.addEventListener('pointerdown',event=>{if(activeIdPreview&&!activeIdPreview.wrapper.contains(event.target))closeIdPreview();});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeIdPreview();});
document.addEventListener('focusin',event=>{if(activeIdPreview&&!activeIdPreview.wrapper.contains(event.target))closeIdPreview();});
function render() {
  closeIdPreview();
  $('#total-count').textContent=records.length;
  const visible=records.filter(r=>activeStatus==='全部'||r.status===activeStatus).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  if(!visible.length){const empty=element('div','empty');empty.append(element('div','empty-icon','≡'),element('strong','',records.length?'暂时没有这类反馈':'还没有反馈，来写下第一条吧'),element('p','',records.length?'切换其他处理结果，查看反馈记录。':'你的问题和建议，会在这里留下记录。'));$('#feedback-list').replaceChildren(empty);return;}
  $('#feedback-list').replaceChildren(...visible.map(record=>{
    const card=element('article','feedback-card'),top=element('div','record-top'),meta=element('div','record-meta');
    const date=new Date(record.createdAt);const time=element('time','',new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date));time.dateTime=record.createdAt;
    if(record.site)meta.append(element('span','site-badge',record.site));
    meta.append(element('span',`type-badge ${record.type==='问题'?'problem':record.type==='其他'?'other':''}`,record.type),time);
    top.append(meta,element('span',`status ${{'待处理':'pending','已解决':'resolved','无需处理':'declined'}[record.status]||'pending'}`,record.status));
    const author=element('div','record-author');
    author.append(element('span','author-name',record.nickname||'匿名访客'));
    if(record.visitorId){const visitor=element('span','visitor-tag',`访客 ${record.visitorId.slice(0,8)}`);visitor.title=`访客编号：${record.visitorId}（浏览器标识，未验证身份）`;author.append(visitor);}
    card.append(top,author,element('p','record-description',record.description));
    if(record.status==='无需处理')card.append(element('div','reason',`无需处理原因：${record.reason}`));
    if(record.attachments?.length){const attachments=element('div','record-files');for(const file of record.attachments){if(!/^attachments\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/.test(file.path))continue;const preview=element('button','attachment-button',`附件 · ${file.name}`);preview.type='button';preview.setAttribute('aria-label',`预览附件 ${file.name}`);preview.onclick=()=>openPreview(file);attachments.append(preview);}card.append(attachments);}
    const footer=element('div','record-footer'),wrapper=element('div','id-preview');
    const identifier=element('button','feedback-id',record.id);identifier.type='button';identifier.setAttribute('aria-label',`查看完整反馈编号 ${record.id}`);identifier.setAttribute('aria-expanded','false');
    const bubble=element('div','id-bubble');bubble.id=`full-id-${record.id}`;bubble.hidden=true;bubble.setAttribute('role','tooltip');bubble.append(element('span','id-bubble-label','完整编号'),element('code','',record.id));
    identifier.setAttribute('aria-controls',bubble.id);
    identifier.onclick=()=>{const wasOpen=!bubble.hidden;closeIdPreview();if(!wasOpen){bubble.hidden=false;identifier.setAttribute('aria-expanded','true');identifier.setAttribute('aria-describedby',bubble.id);activeIdPreview={wrapper,button:identifier,bubble};}};
    wrapper.append(identifier,bubble);
    const copy=element('button','copy-id','复制编号');copy.type='button';copy.setAttribute('aria-label',`复制反馈编号 ${record.id}`);
    copy.onclick=async()=>{try{await navigator.clipboard.writeText(record.id);copy.textContent='已复制';}catch{copy.textContent='手动复制';if(bubble.hidden)identifier.click();identifier.focus();}};
    footer.append(element('span','','编号'),wrapper,copy);card.append(footer);
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
  const data=new FormData(event.target);data.delete('attachments');data.set('visitorId',profile.visitorId);data.set('nickname',$('#nickname').value.trim());for(const file of files)data.append('attachments',file);
  try {
    const response=await fetch(`${config.apiUrl.replace(/\/$/,'')}/feedback`,{method:'POST',body:data});
    const result=await response.json();if(!response.ok)throw Error(result.error||'提交失败，请稍后重试。');
    records=[result,...records.filter(r=>r.id!==result.id)];activeStatus='全部';for(const item of document.querySelectorAll('.filter')){const selected=item.dataset.status==='全部';item.classList.toggle('active',selected);item.setAttribute('aria-pressed',String(selected));}
    render();event.target.reset();$('#nickname').value=profile.nickname;files=[];$('#description-count').textContent='0 / 5000';message('反馈已提交，当前状态为“待处理”。','success');
  } catch(error) {message(error.message==='Failed to fetch'?'网络连接失败，请保留内容并重试。':error.message);}
  finally {busy=false;$('#submit-button').disabled=false;$('#submit-button').textContent='提交反馈';showFiles();}
});
render();load();
