import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomBytes,createHash} from 'node:crypto';
import {MAX_BYTES,CHUNK_BYTES} from './uploads.mjs';

test('large chunk upload, 10 GB boundary, restart, retries and private staging',async()=>{
 const directory=await mkdtemp(tmpdir()+'/tkj-chunks-'),token=randomBytes(32).toString('hex'),base='http://127.0.0.1:4175';let server;
 const headers={Authorization:'Bearer '+token};
 async function start(){server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4175',DATA_DIR:directory,ADMIN_TOKEN:token},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)));});}
 async function stop(){if(!server)return;const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped;server=null;}
 const create=(size,extra={})=>fetch(base+'/api/uploads?'+new URLSearchParams({name:'archive.zip',title:'Archive fixture',category:'File',size:String(size),...extra}),{method:'POST',headers});
 const call=(id,method='GET',suffix='',body,offset)=>fetch(base+'/api/uploads/'+id+suffix,{method,headers:{...headers,...(offset===undefined?{}:{'Upload-Offset':String(offset)})},body});
 try{
  await start();assert.equal((await(await fetch(base+'/api/upload-config')).json()).maxFileSize,MAX_BYTES);
  assert.equal((await fetch(base+'/api/uploads',{method:'POST'})).status,401);
  assert.equal((await create(MAX_BYTES+1)).status,413);assert.equal((await create(-1)).status,400);
  assert.equal((await create(20,{name:'../bad.zip'})).status,400);
  const exact=await create(MAX_BYTES);assert.equal(exact.status,201);const boundary=await exact.json();assert.equal((await call(boundary.id,'DELETE')).status,200);
  const size=128*1024**2+137,created=await create(size);assert.equal(created.status,201);const {id}=await created.json();
  for(const method of ['GET','PUT','DELETE','POST'])assert.equal((await fetch(base+'/api/uploads/'+id+(method==='POST'?'/complete':''),{method})).status,401);
  assert.equal((await call(id,'POST','/complete')).status,409);
  assert.equal((await call(id,'PUT','',Buffer.from('PK'),42)).status,409);
  assert.equal((await call(id,'PUT','',Buffer.alloc(CHUNK_BYTES+1,0x61),0)).status,413);
  assert.equal((await(await call(id)).json()).offset,0);
  const hash=createHash('sha256');let offset=0;
  while(offset<size){const chunk=Buffer.alloc(Math.min(CHUNK_BYTES,size-offset),0x61);if(!offset)Buffer.from('504b0304','hex').copy(chunk);hash.update(chunk);
   const response=await call(id,'PUT','',chunk,offset);assert.equal(response.status,200);offset=(await response.json()).offset;
   if(offset===CHUNK_BYTES){await stop();await start();assert.equal((await(await call(id)).json()).offset,offset);assert.equal((await call(id,'PUT','',chunk,0)).status,409);}
  }
  for(const pathname of ['/data/.uploads/'+id+'.part','/.uploads/'+id+'.json','/uploads.mjs'])assert.equal((await fetch(base+pathname)).status,404);
  assert.equal((await call(id,'PUT','',Buffer.from('extra'),size)).status,413);
  const finished=await call(id,'POST','/complete');assert.equal(finished.status,201);const entry=await finished.json();assert.equal(entry.size,size);assert.equal(entry.sha256,hash.digest('hex'));
  assert.equal((await call(id,'POST','/complete')).status,200);assert.equal((await(await call(id)).json()).completed,true);
  const downloaded=await fetch(base+'/download/'+id),downloadHash=createHash('sha256');let downloadedSize=0;for await(const chunk of downloaded.body){downloadHash.update(chunk);downloadedSize+=chunk.length;}assert.equal(downloadedSize,size);assert.equal(downloadHash.digest('hex'),entry.sha256);
  const invalid=await(await create(4)).json();await call(invalid.id,'PUT','',Buffer.from('fake'),0);assert.equal((await call(invalid.id,'POST','/complete')).status,400);assert.equal((await call(invalid.id)).status,404);
  const parallel=await Promise.all(Array.from({length:4},()=>create(100)));assert.equal(parallel.filter(response=>response.status===201).length,3);assert.equal(parallel.filter(response=>response.status===409).length,1);
  for(const response of parallel)if(response.status===201)await call((await response.json()).id,'DELETE');
  await stop();await start();assert.equal((await(await fetch(base+'/api/files')).json()).length,1);
 }finally{await stop();await rm(directory,{recursive:true,force:true});}
});
