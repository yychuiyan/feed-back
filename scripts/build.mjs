import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {fromMarkdown} from './records.mjs';
import {createHash} from 'node:crypto';
await rm('dist', {recursive:true,force:true});
await mkdir('dist', {recursive:true});
await cp('public','dist',{recursive:true});
const hash=createHash('sha256');
for(const file of ['index.html','style.css','config.js','app.js','profile.js'])hash.update(await readFile(`public/${file}`));
const version=hash.digest('hex').slice(0,12);
const html=(await readFile('dist/index.html','utf8')).replace(/\.\/(style\.css|config\.js|app\.js)/g,`./$1?v=${version}`);
await writeFile('dist/index.html',html);
const app=(await readFile('dist/app.js','utf8')).replace("'./profile.js'",`'./profile.js?v=${version}'`);
await writeFile('dist/app.js',app);
const records = [];
for (const file of await readdir('feedback')) {
  if (file.endsWith('.md') && file !== 'README.md') records.push(fromMarkdown(await readFile(`feedback/${file}`,'utf8')));
}
records.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
await writeFile('dist/feedback.json',JSON.stringify(records));
try { await cp('attachments','dist/attachments',{recursive:true}); } catch(e) {if(e.code !== 'ENOENT') throw e;}
await writeFile('dist/.nojekyll','');
console.log(`Built static site with ${records.length} feedback records.`);
