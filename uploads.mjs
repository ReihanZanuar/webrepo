import {promises as fs, createReadStream} from 'node:fs';
import {randomUUID, createHash} from 'node:crypto';
import path from 'node:path';

export const MAX_BYTES=10*1024**3;
export const CHUNK_BYTES=16*1024**2;
const lifetime=24*60*60*1000;
export function metadata(params){
 const value=Object.fromEntries(['name','title','category','description','version'].map(key=>[key,params.get(key)||'']));
 const ext=path.extname(value.name).toLowerCase();
 if(!/^[\p{L}\p{N} _().-]{1,120}$/u.test(value.name)||!value.title.trim()||value.title.length>100||value.description.length>1000||value.version.length>40||!['Ebook','Aplikasi','File'].includes(value.category)||!['.pdf','.zip','.exe','.msi','.txt'].includes(ext))return null;
 value.title=value.title.trim();return value;
}
export function validSignature(name,head,size){
 const ext=path.extname(name).toLowerCase();
 return size>0&&(ext==='.pdf'?head.subarray(0,5).toString()==='%PDF-':ext==='.zip'?['504b0304','504b0506','504b0708'].includes(head.subarray(0,4).toString('hex')):ext==='.exe'?head.subarray(0,2).toString()==='MZ':ext==='.msi'?head.subarray(0,8).toString('hex')==='d0cf11e0a1b11ae1':!head.includes(0));
}
class UploadError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new UploadError(status,message);};

export async function openUploads(data,catalog,{authorized,json}){
 const directory=path.join(data,'.uploads'),sessions=new Map(),locks=new Set();let creating=0;
 await fs.mkdir(directory,{recursive:true,mode:0o700});
 const partial=id=>path.join(directory,id+'.part');
 const record=id=>path.join(directory,id+'.json');
 async function remove(id){sessions.delete(id);await Promise.all([fs.rm(partial(id),{force:true}),fs.rm(record(id),{force:true})]);}
 for(const name of await fs.readdir(directory)){
  if(!/^[a-f0-9-]{36}\.json$/.test(name))continue;
  const id=name.slice(0,-5);
  try{const session=JSON.parse(await fs.readFile(record(id),'utf8'));if(session.id!==id||!metadata(new URLSearchParams(session))||!Number.isSafeInteger(session.size)||session.size<1||session.size>MAX_BYTES||!Number.isFinite(session.startedAt)||Date.now()-session.startedAt>lifetime){await remove(id);continue;}await fs.access(partial(id));sessions.set(id,session);}catch{await remove(id);}
 }
 async function cleanup(){for(const [id,session]of sessions)if(!locks.has(id)&&Date.now()-session.startedAt>lifetime)await remove(id);}
 const timer=setInterval(()=>cleanup().catch(()=>{}),60000);timer.unref();
 const attempts=new Map();
 function limited(req){const ip=req.socket.remoteAddress,now=Date.now();for(const [key,value]of attempts)if(now>value.until)attempts.delete(key);let rate=attempts.get(ip);if(!rate){rate={count:0,until:now+60000};attempts.set(ip,rate);}return ++rate.count>30;}
 async function handle(req,res,url){
  const match=/^\/api\/uploads\/([a-f0-9-]{36})(\/complete)?$/.exec(url.pathname);
  if(url.pathname!=='/api/uploads'&&!match)return false;
  try{
   if(!authorized(req)){if(limited(req))fail(429,'Terlalu banyak percobaan. Tunggu satu menit.');fail(401,'Kunci admin tidak valid atau upload belum diaktifkan.');}
   if(req.method==='POST'&&url.pathname==='/api/uploads'){
    if(limited(req))fail(429,'Terlalu banyak upload baru. Tunggu satu menit.');
    const info=metadata(url.searchParams),size=Number(url.searchParams.get('size'));
    if(!info||!Number.isSafeInteger(size)||size<1)fail(400,'Metadata atau ukuran file tidak valid.');
    if(size>MAX_BYTES)fail(413,'Batas ukuran file 10 GB.');
    await cleanup();if(sessions.size+creating>=3)fail(409,'Masih ada 3 upload tertunda. Selesaikan atau batalkan terlebih dahulu.');
    creating++;
    try{
    const disk=await fs.statfs(data);if(Number(disk.bavail)*Number(disk.bsize)<size+64*1024**2)fail(507,'Ruang penyimpanan server tidak cukup untuk file ini.');
    const session={...info,id:randomUUID(),size,startedAt:Date.now()};
    const file=await fs.open(partial(session.id),'wx',0o600);await file.close();
    try{await fs.writeFile(record(session.id),JSON.stringify(session),{flag:'wx',mode:0o600});}catch(error){await fs.rm(partial(session.id),{force:true});throw error;}
    sessions.set(session.id,session);json(res,201,{id:session.id,offset:0,chunkSize:CHUNK_BYTES,maxFileSize:MAX_BYTES});return true;
    }finally{creating--;}
   }
   if(!match)fail(405,'Metode tidak didukung.');
   const id=match[1],session=sessions.get(id);
   if(req.method==='GET'&&!match[2]&&catalog.get(id)){const item=catalog.get(id);json(res,200,{id,offset:item.size,size:item.size,completed:true});return true;}
   if(req.method==='POST'&&match[2]&&catalog.get(id)){json(res,200,catalog.get(id));return true;}
   if(!session)fail(404,'Upload tidak ditemukan atau sudah kedaluwarsa.');
   if(locks.has(id))fail(409,'Bagian sebelumnya masih diproses. Coba lagi.');
   locks.add(id);
   try{
    const stat=await fs.stat(partial(id));
    if(req.method==='GET'&&!match[2]){json(res,200,{id,offset:stat.size,size:session.size,chunkSize:CHUNK_BYTES});return true;}
    if(req.method==='DELETE'&&!match[2]){await remove(id);json(res,200,{cancelled:true});return true;}
    if(req.method==='PUT'&&!match[2]){
     const offset=Number(req.headers['upload-offset']);
     if(req.headers['upload-offset']===undefined||!Number.isSafeInteger(offset)||offset!==stat.size){json(res,409,{error:'Posisi upload berubah. Periksa posisi sebelum mencoba lagi.',offset:stat.size});return true;}
     const declared=Number(req.headers['content-length']);
     if(declared>CHUNK_BYTES||stat.size+declared>session.size)fail(413,'Bagian file melebihi ukuran yang diizinkan.');
     const file=await fs.open(partial(id),'r+');let received=0;
     try{
      for await(const chunk of req){received+=chunk.length;if(received>CHUNK_BYTES||stat.size+received>session.size)fail(413,'Bagian file melebihi ukuran yang diizinkan.');
       let written=0;while(written<chunk.length){const result=await file.write(chunk,written,chunk.length-written,stat.size+received-chunk.length+written);written+=result.bytesWritten;}
      }
      if(!received)fail(400,'Bagian file kosong.');
      await file.sync();json(res,200,{offset:stat.size+received});return true;
     }catch(error){await file.truncate(stat.size);throw error;}finally{await file.close();}
    }
    if(req.method==='POST'&&match[2]){
     if(stat.size!==session.size)fail(409,'Upload belum lengkap. Lanjutkan pengiriman file.');
     const head=Buffer.alloc(Math.min(4096,stat.size)),file=await fs.open(partial(id),'r');try{await file.read(head,0,head.length,0);}finally{await file.close();}
     if(!validSignature(session.name,head,stat.size)){await remove(id);fail(400,'Isi file tidak cocok dengan jenis yang dipilih.');}
     const hash=createHash('sha256');for await(const chunk of createReadStream(partial(id)))hash.update(chunk);
     const {startedAt,...info}=session,entry={...info,sha256:hash.digest('hex'),createdAt:new Date().toISOString()};
     const target=path.join(data,id+'.bin');await fs.rename(partial(id),target);
     try{catalog.add(entry);}catch(error){await fs.rename(target,partial(id));throw error;}
     await remove(id);json(res,201,entry);return true;
    }
    fail(405,'Metode tidak didukung.');
   }finally{locks.delete(id);}
  }catch(error){if(!res.headersSent&&!res.destroyed)json(res,error.status||500,{error:error.status?error.message:error.code==='ENOSPC'?'Ruang penyimpanan server penuh.':'Upload belum dapat diproses. Coba lagi.'});}
  return true;
 }
 return {handle};
}
