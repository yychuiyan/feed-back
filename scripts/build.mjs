import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {fromMarkdown} from './records.mjs';
import {createHash} from 'node:crypto';
await rm('dist', {recursive:true,force:true});
await mkdir('dist', {recursive:true});
await cp('public','dist',{recursive:true});
const hash=createHash('sha256');
for(const file of ['index.html','style.css','config.js','app.js','profile.js','search.js'])hash.update(await readFile(`public/${file}`));
hash.update(await readFile('package-lock.json'));
const version=hash.digest('hex').slice(0,12);
const html=(await readFile('dist/index.html','utf8')).replace(/\.\/(style\.css|config\.js|app\.js)/g,`./$1?v=${version}`);
await writeFile('dist/index.html',html);
const app=(await readFile('dist/app.js','utf8')).replace("'./profile.js'",`'./profile.js?v=${version}'`).replace("'./search.js'",`'./search.js?v=${version}'`).replace("'./pdfjs/pdf.js'",`'./pdfjs/pdf.js?v=${version}'`).replace("'./pdfjs/pdf.worker.js'",`'./pdfjs/pdf.worker.js?v=${version}'`);
await writeFile('dist/app.js',app);
await mkdir('dist/pdfjs',{recursive:true});
await cp('node_modules/pdfjs-dist/legacy/build/pdf.min.mjs','dist/pdfjs/pdf.js');
await cp('node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs','dist/pdfjs/pdf.worker.js');
for(const directory of ['cmaps','standard_fonts','wasm'])await cp(`node_modules/pdfjs-dist/${directory}`,`dist/pdfjs/${directory}`,{recursive:true});
await cp('node_modules/pdfjs-dist/LICENSE','dist/pdfjs/LICENSE');
const records = [];
for (const file of await readdir('feedback')) {
  if (file.endsWith('.md') && file !== 'README.md') records.push(fromMarkdown(await readFile(`feedback/${file}`,'utf8')));
}
records.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
await writeFile('dist/feedback.json',JSON.stringify(records));
try { await cp('attachments','dist/attachments',{recursive:true}); } catch(e) {if(e.code !== 'ENOENT') throw e;}
await writeFile('dist/.nojekyll','');
console.log(`Built static site with ${records.length} feedback records.`);
