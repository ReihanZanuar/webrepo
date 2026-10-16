const MAX=10*1024**3,CHUNK=16*1024**2;
export const formatSize=n=>n>=1024**3?`${(n/1024**3).toFixed(2)} GB`:n>=1024**2?`${(n/1024**2).toFixed(1)} MB`:`${(n/1024).toFixed(1)} KB`;
const cancelled=()=>new DOMException('Upload dibatalkan.','AbortError');
async function request(url,auth,options={}){
 const response=await fetch(url,{...options,headers:{Authorization:auth,...options.headers}});
 const body=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(body.error||`Server belum dapat menerima upload (${response.status}).`);error.status=response.status;throw error;}
 return body;
}
function chunk(url,blob,offset,auth,signal,progress){
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();
  const abort=()=>xhr.abort(),finish=(error,value)=>{signal.removeEventListener('abort',abort);error?reject(error):resolve(value);};
  xhr.open('PUT',url);xhr.responseType='json';xhr.timeout=15*60*1000;
  xhr.setRequestHeader('Authorization',auth);xhr.setRequestHeader('Content-Type','application/octet-stream');xhr.setRequestHeader('Upload-Offset',String(offset));
  xhr.upload.onprogress=event=>progress(offset+event.loaded);
  xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300)finish(null,xhr.response);else{const error=new Error(xhr.response?.error||'Bagian file belum diterima server.');error.status=xhr.status;finish(error);}};
  xhr.onerror=()=>finish(new Error('Koneksi terputus.'));
  xhr.ontimeout=()=>finish(new Error('Pengiriman bagian file melewati batas waktu.'));
  xhr.onabort=()=>finish(cancelled());
  signal.addEventListener('abort',abort,{once:true});if(signal.aborted){finish(cancelled());return;}
  xhr.send(blob);
 });
}
export function mountUploads(load){
 const form=document.querySelector('#upload'),status=document.querySelector('#upload-status'),bar=document.querySelector('#upload-progress'),cancel=document.querySelector('#upload-cancel'),submit=document.querySelector('#submit');
 let controller=null,pending=null;
 window.addEventListener('beforeunload',event=>{if(controller){event.preventDefault();event.returnValue='';}});
 cancel.addEventListener('click',()=>controller?.abort());
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(controller)return;
  const file=form.elements.file.files[0];if(!file)return;
  if(!file.size||file.size>MAX){status.textContent='Pilih file dengan ukuran lebih dari 0 byte, maksimal 10 GB.';return;}
  const params=new URLSearchParams({name:file.name,title:form.elements.title.value,category:form.elements.category.value,description:form.elements.description.value,version:form.elements.version.value,size:String(file.size)});
  const key=params.toString(),auth=`Bearer ${form.elements.token.value}`;
  controller=new AbortController();const signal=controller.signal;
  form.querySelectorAll('input,select,textarea').forEach(input=>input.disabled=true);submit.disabled=true;cancel.hidden=false;bar.hidden=false;bar.max=file.size;bar.value=0;
  const progress=bytes=>{bar.value=bytes;status.textContent=`Mengunggah ${Math.min(100,bytes/file.size*100).toFixed(1)}% · ${formatSize(bytes)} / ${formatSize(file.size)}`;};
  try{
   if(pending&&(pending.file!==file||pending.key!==key)){await request(`/api/uploads/${pending.id}`,auth,{method:'DELETE'}).catch(()=>{});pending=null;}
   if(!pending){status.textContent='Menyiapkan penyimpanan file…';const created=await request(`/api/uploads?${params}`,auth,{method:'POST'});pending={id:created.id,file,key};}
   if(signal.aborted)throw cancelled();
   const url=`/api/uploads/${pending.id}`;
   let {offset}=await request(url,auth,{signal}),failures=0;
   while(offset<file.size){
    if(signal.aborted)throw cancelled();progress(offset);
    try{
     const result=await chunk(url,file.slice(offset,Math.min(offset+CHUNK,file.size)),offset,auth,signal,progress);
     if(!Number.isSafeInteger(result?.offset)||result.offset<=offset||result.offset>file.size)throw new Error('Posisi upload tidak valid.');
     offset=result.offset;failures=0;
    }catch(error){
     if(error.name==='AbortError'||[400,401,403,404,413,507].includes(error.status)||++failures>3)throw error;
     status.textContent=`Koneksi terganggu. Mencoba kembali bagian ini (${failures}/3)…`;
     await new Promise(resolve=>setTimeout(resolve,failures*1000));
     if(signal.aborted)throw cancelled();
     ({offset}=await request(url,auth,{signal}));
    }
   }
   bar.value=file.size;cancel.disabled=true;status.textContent='Seluruh bagian diterima. Memeriksa dan menyimpan file…';
   await request(url+'/complete',auth,{method:'POST',signal});
   pending=null;form.reset();status.textContent='File tersimpan dan sudah tersedia di repository.';await load();
  }catch(error){
   if(error.name==='AbortError'){
    if(pending)await request(`/api/uploads/${pending.id}`,auth,{method:'DELETE'}).catch(()=>{});
    pending=null;status.textContent='Upload dibatalkan.';
   }else{
    if(error.status===404)pending=null;
    status.textContent=(error.message||'Upload gagal.')+' Tekan Unggah file untuk mencoba kembali.';
   }
  }finally{controller=null;submit.disabled=false;cancel.hidden=true;cancel.disabled=false;form.querySelectorAll('input,select,textarea').forEach(input=>input.disabled=false);}
 });
}
