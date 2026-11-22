import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {fromMarkdown} from './records.mjs';
await rm('dist', {recursive:true,force:true});
await mkdir('dist', {recursive:true});
await cp('public','dist',{recursive:true});
const records = [];
for (const file of await readdir('feedback')) {
  if (file.endsWith('.md') && file !== 'README.md') records.push(fromMarkdown(await readFile(`feedback/${file}`,'utf8')));
}
records.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
await writeFile('dist/feedback.json',JSON.stringify(records));
try { await cp('attachments','dist/attachments',{recursive:true}); } catch(e) {if(e.code !== 'ENOENT') throw e;}
await writeFile('dist/.nojekyll','');
console.log(`Built static site with ${records.length} feedback records.`);
