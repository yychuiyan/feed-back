import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fromMarkdown,toMarkdown} from '../scripts/records.mjs';
import worker,{saveRecord} from '../server/worker.mjs';
const record={id:'fb-test',type:'问题',status:'待处理',reason:'',createdAt:'2026-11-22T00:00:00Z',description:'操作失败\n\n---\n<script>alert(1)</script>',attachments:[]};
const env={GITHUB_TOKEN:'test-only',GITHUB_REPOSITORY:'owner/repo',ALLOWED_ORIGINS:'https://example.com',SUBMISSION_LIMITER:{limit:async()=>({success:true})}};
function request(fields={},attachment){const form=new FormData();form.set('description','反馈');form.set('type','需求');for(const [k,v] of Object.entries(fields))form.set(k,v);if(attachment)form.append('attachments',attachment,'danger.html');return new Request('https://api.example.com/feedback',{method:'POST',headers:{Origin:'https://example.com'},body:form});}
test('Markdown preserves multiline text and ignores body delimiters',()=>assert.deepEqual(fromMarkdown(toMarkdown(record)),record));
test('declined feedback requires a reason',()=>assert.throws(()=>toMarkdown({...record,status:'无需处理'}),/原因/));
test('disallows attachment traversal paths',()=>assert.throws(()=>toMarkdown({...record,attachments:[{name:'x',path:'attachments/fb-test/../../x'}]}),/路径/));
test('blocks untrusted origin',async()=>assert.equal((await worker.fetch(new Request('https://api.example.com/feedback',{method:'POST'}),env)).status,403));
test('rejects blank descriptions',async()=>assert.equal((await worker.fetch(request({description:'  '}),env)).status,400));
test('rejects unsupported attachments',async()=>assert.equal((await worker.fetch(request({},new Blob(['html'])),env)).status,400));
test('enforces rate limits before GitHub requests',async()=>assert.equal((await worker.fetch(request(),{...env,SUBMISSION_LIMITER:{limit:async()=>({success:false})}})).status,429));
test('commits markdown and attachment atomically and retries concurrent update',async()=>{
  const calls=[];let updates=0;
  const fetcher=async(url,init)=>{const data=init.body?JSON.parse(init.body):null;calls.push({url,method:init.method,data});let result={sha:'blob'};
    if(url.includes('/git/ref/'))result={object:{sha:`parent-${updates}`}};
    else if(/\/git\/commits\/parent/.test(url))result={tree:{sha:'base-tree'}};
    else if(url.endsWith('/git/trees'))result={sha:'new-tree'};
    else if(url.endsWith('/git/commits'))result={sha:'new-commit'};
    else if(init.method==='PATCH'){updates++;if(updates===1)return new Response('{}',{status:422});result={};}
    return Response.json(result);
  };
  await saveRecord(env,record,[{path:'attachments/fb-test/1.txt',file:new Blob(['proof'])}],fetcher);
  const trees=calls.filter(c=>c.url.endsWith('/git/trees'));
  assert.equal(trees.length,2);assert.equal(trees[0].data.tree.length,2);assert.equal(trees[0].data.base_tree,'base-tree');
  assert.equal(calls.filter(c=>c.method==='PATCH')[1].data.force,false);
  assert.deepEqual(calls.filter(c=>c.url.endsWith('/git/commits'))[1].data.parents,['parent-1']);
});
