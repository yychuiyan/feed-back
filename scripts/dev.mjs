import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
createServer(async(req,res)=>{try{const file=path.resolve(root, '.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)&&file!==root)throw Error();const target=file===root?path.join(root,'index.html'):file;res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(await readFile(target));}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
