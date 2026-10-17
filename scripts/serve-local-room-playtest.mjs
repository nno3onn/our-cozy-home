import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const ports=process.argv.slice(2).map(Number);
if(!ports.length||ports.some(p=>!Number.isInteger(p)||p<1024||p>65535))throw new Error('Provide explicit local test ports');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.css':'text/css','.woff2':'font/woff2','.ttf':'font/ttf'};
for(const port of ports)createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    let file=resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const exists=await stat(file).catch(()=>null);
    if(!exists?.isFile()){
      if(extname(pathname)){res.writeHead(404);res.end();return;}
      file=resolve(root,'index.html');
    }
    res.writeHead(200,{'content-type':types[extname(file)]??'application/octet-stream','cache-control':'no-store'});
    res.end(await readFile(file));
  }catch{res.writeHead(400);res.end();}
}).listen(port,'127.0.0.1',()=>console.log(`Local playtest: http://127.0.0.1:${port}`));
