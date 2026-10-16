import http from 'node:http';
import { promises as fs, createReadStream } from 'node:fs';
import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openCatalog } from './database.mjs';
import {openUploads,MAX_BYTES,validSignature} from './uploads.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const data=process.env.DATA_DIR || path.join(root,'data');
await fs.mkdir(data,{recursive:true,mode:0o700});
const catalog=await openCatalog(data);
const MAX=MAX_BYTES, token=process.env.ADMIN_TOKEN || '', limits=new Map();
const categories=['Ebook','Aplikasi','File'];
let busy=false;
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
async function list(){return catalog.list();}
function authorized(req){const supplied=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer /,'')),expected=Buffer.from(token);return token.length>=24 && supplied.length===expected.length && timingSafeEqual(supplied,expected);}
const uploads=await openUploads(data,catalog,{authorized,json});
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET' && url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 if(req.method==='GET' && url.pathname==='/api/health')return json(res,catalog.healthy()?200:503,{status:'ok'});
 if(req.method==='GET' && url.pathname==='/api/files')return json(res,200,await list());
 if(req.method==='GET' && url.pathname==='/api/upload-config')return json(res,200,{maxFileSize:MAX,chunkSize:16*1024**2});
 if(await uploads.handle(req,res,url))return;
 if(req.method==='POST' && url.pathname==='/api/files'){
  const ip=req.socket.remoteAddress,now=Date.now();let rate=limits.get(ip);if(!rate||now>rate.until){rate={count:0,until:now+60000};limits.set(ip,rate);}if(++rate.count>20)return json(res,429,{error:'Terlalu banyak percobaan. Tunggu satu menit.'});
  if(!authorized(req))return json(res,401,{error:token.length<24?'Upload belum diaktifkan. Atur ADMIN_TOKEN di server.':'Kunci admin tidak valid.'});
  if(busy)return json(res,409,{error:'Upload lain sedang berjalan. Coba lagi setelah selesai.'});
  const name=url.searchParams.get('name')||'',title=url.searchParams.get('title')||'',category=url.searchParams.get('category'),description=url.searchParams.get('description')||'',version=url.searchParams.get('version')||'';
  const ext=path.extname(name).toLowerCase();
  if(!/^[\p{L}\p{N} _().-]{1,120}$/u.test(name)||!title.trim()||title.length>100||description.length>1000||version.length>40||!categories.includes(category)||!['.pdf','.zip','.exe','.msi','.txt'].includes(ext))return json(res,400,{error:'Metadata tidak valid. Gunakan PDF, ZIP, EXE, MSI, atau TXT.'});
  if(Number(req.headers['content-length'])>MAX)return json(res,413,{error:'Batas ukuran file 10 GB.'});
  busy=true;const id=randomUUID(),temp=path.join(data,id+'.tmp');let handle;
  try{
   handle=await fs.open(temp,'wx',0o600);let size=0,head=Buffer.alloc(0);const hash=createHash('sha256');
   for await(const chunk of req){size+=chunk.length;if(size>MAX){json(res,413,{error:'Batas ukuran file 10 GB.'});return;}if(head.length<4096)head=Buffer.concat([head,chunk]).subarray(0,4096);hash.update(chunk);await handle.writeFile(chunk);}
   const valid=validSignature(name,head,size);
   if(!valid)return json(res,400,{error:'Isi file tidak cocok dengan jenis yang dipilih.'});
   await handle.close();handle=null;await fs.rename(temp,path.join(data,id+'.bin'));
   const entry={id,name,title:title.trim(),category,description,version,size,sha256:hash.digest('hex'),createdAt:new Date().toISOString()};
   try{catalog.add(entry);}catch(error){await fs.rm(path.join(data,id+'.bin'),{force:true});throw error;}return json(res,201,entry);
  }finally{if(handle)await handle.close();await fs.rm(temp,{force:true});busy=false;}
 }
 if(req.method==='GET' && /^\/download\/[a-f0-9-]{36}$/.test(url.pathname)){
  const id=url.pathname.split('/').pop(),item=catalog.get(id);if(!item)return json(res,404,{error:'File tidak ditemukan.'});
  try{await fs.access(path.join(data,id+'.bin'));}catch{return json(res,404,{error:'Berkas tidak tersedia.'});}
  res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':item.size,'Content-Disposition':`attachment; filename="download${path.extname(item.name)}"; filename*=UTF-8''${encodeURIComponent(item.name)}`});const stream=createReadStream(path.join(data,id+'.bin'));stream.on('error',()=>res.destroy());stream.pipe(res);return;
 }
 const vendor={'/vendor/three.module.js':'three.module.js','/vendor/three.core.js':'three.core.js'};
 if(req.method==='GET' && vendor[url.pathname]){res.setHeader('Content-Type','text/javascript');res.end(await fs.readFile(path.join(root,'node_modules/three/build',vendor[url.pathname])));return;}
 const routes={'/':'index.html','/style.css':'style.css','/lab.css':'lab.css','/app.js':'app.js','/lab.js':'lab.js','/lab-controls.js':'lab-controls.js','/camera-route.js':'camera-route.js','/upload-client.js':'upload-client.js'};
 if(req.method==='GET' && routes[url.pathname]){const file=routes[url.pathname];res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(await fs.readFile(path.join(root,'public',file)));return;}
 json(res,404,{error:'Halaman tidak ditemukan.'});
 }catch{if(!res.headersSent)json(res,500,{error:'Permintaan tidak dapat diproses.'});else res.end();}
});
server.requestTimeout=24*60*60*1000;
server.headersTimeout=30000;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>{catalog.close();process.exit(0);});setTimeout(()=>process.exit(1),25000).unref();});
setInterval(()=>{for(const [key,value]of limits)if(Date.now()>value.until)limits.delete(key);},60000).unref();
server.listen(Number(process.env.PORT||4173),process.env.HOST||'127.0.0.1',()=>console.log(`Lab TKJ: http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||4173}`));
