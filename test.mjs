import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

const dir=await mkdtemp(tmpdir()+'/tkj-test-');
const token=randomBytes(32).toString('hex'),base='http://127.0.0.1:4174';
let child;
async function start(){
 child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4174',DATA_DIR:dir,ADMIN_TOKEN:token},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));});
}
async function stop(){if(child){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;child=null;}}
const upload=(params,content,auth=token)=>fetch(base+'/api/files?'+new URLSearchParams(params),{method:'POST',headers:{Authorization:'Bearer '+auth},body:content});

test('SQLite uploads, validation, persistence, migration and private storage',async()=>{
 try{
  await start();assert.equal((await fetch(base)).status,200);
  assert.equal((await fetch(base+'/api/health')).status,200);
  assert.deepEqual(await(await fetch(base+'/api/files')).json(),[]);
  const params={name:'catatan.txt',title:"Catatan ' jaringan",category:'File',description:'Fixture pengujian'};
  const body='Uji penyimpanan server';
  assert.equal((await upload(params,body,'wrong')).status,401);
  assert.equal((await upload({...params,name:'../secret.txt'},body)).status,400);
  assert.equal((await upload({...params,name:'fake.pdf'},body)).status,400);
  assert.equal((await upload({...params,category:'Praktik'},body)).status,400);
  const response=await upload(params,body);assert.equal(response.status,201);
  const file=await response.json();assert.equal(file.sha256,createHash('sha256').update(body).digest('hex'));
  assert.equal((await upload({...params,name:'panduan.pdf',title:'Panduan',category:'Ebook'},'%PDF-1.7\nTest fixture')).status,201);
  assert.equal((await upload({...params,name:'aplikasi.exe',title:'Aplikasi fixture',category:'Aplikasi'},Buffer.from('MZ\0test'))).status,201);
  const download=await fetch(base+'/download/'+file.id);
  assert.equal(await download.text(),body);assert.match(download.headers.get('content-disposition'),/^attachment;/);
  for(const pathname of ['/server.mjs','/database.mjs','/data/catalog.sqlite','/.env','/node_modules/three/package.json']) assert.equal((await fetch(base+pathname)).status,404);
  await stop();
  assert.equal((await readFile(dir+'/catalog.sqlite')).subarray(0,15).toString(),'SQLite format 3');
  const db=new DatabaseSync(dir+'/catalog.sqlite');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM files').get().n,3);db.close();
  const legacy=[];
  for(const category of ['Modul','Praktik']){
   const id=randomUUID();const entry={id,name:'lama.txt',title:'Koleksi lama',category,description:'',version:'',size:body.length,sha256:createHash('sha256').update(body).digest('hex'),createdAt:new Date().toISOString()};
   await writeFile(dir+'/'+id+'.bin',body);await writeFile(dir+'/'+id+'.json',JSON.stringify(entry));legacy.push(id);
  }
  await start();const migrated=await(await fetch(base+'/api/files')).json();assert.equal(migrated.length,5);
  assert.equal(migrated.find(f=>f.id===legacy[0]).category,'Ebook');assert.equal(migrated.find(f=>f.id===legacy[1]).category,'File');
  assert.equal(await(await fetch(base+'/download/'+file.id)).text(),body);
  await stop();await start();assert.equal((await(await fetch(base+'/api/files')).json()).length,5);
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
