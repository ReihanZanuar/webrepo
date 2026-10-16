import './lab.js';
import {mountUploads,formatSize as size} from './upload-client.js';
const $=s=>document.querySelector(s);let files=[],category=$('[data-category][aria-pressed=true]').dataset.category;
const settingsToggle=$('#lab-settings-toggle'),settingsPanel=$('#lab-settings-panel'),mobileLayout=matchMedia('(max-width:760px)');
function closeSettings(){delete document.body.dataset.labSettings;settingsToggle.setAttribute('aria-expanded','false');}
function placeSettings(){closeSettings();(mobileLayout.matches?document.body:$('.lab-tools')).append(settingsPanel);}
settingsToggle.addEventListener('click',()=>{
  const open=settingsToggle.getAttribute('aria-expanded')!=='true';
  settingsToggle.setAttribute('aria-expanded',String(open));
  if(open)document.body.dataset.labSettings='open';else closeSettings();
});
document.addEventListener('pointerdown',event=>{if(!settingsPanel.contains(event.target)&&!settingsToggle.contains(event.target))closeSettings();});
document.addEventListener('focusin',event=>{if(!settingsPanel.contains(event.target)&&!settingsToggle.contains(event.target))closeSettings();});
window.addEventListener('scroll',closeSettings,{passive:true});
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&settingsToggle.getAttribute('aria-expanded')==='true'){
    event.preventDefault();event.stopPropagation();closeSettings();settingsToggle.focus({preventScroll:true});
  }
},{capture:true});
mobileLayout.addEventListener('change',placeSettings);placeSettings();
const computer=$('#computer');
$('.lab-viewport').append(computer);
$('.lab-tools').prepend($('#computer-close'));
$('#computer-open').addEventListener('click',()=>document.dispatchEvent(new Event('computer-open')));
$('#computer-close').addEventListener('click',()=>document.dispatchEvent(new Event('computer-close')));
function serviceFallback(){
  computer.classList.add('monitor-fallback');computer.hidden=false;computer.style.transform='none';
  $('#workstation .story-copy').insertBefore(computer,$('#workstation .next-section'));
  $('#computer-open').hidden=true;$('#computer-close').hidden=true;
}
if(document.body.dataset.webgl==='unavailable')serviceFallback();
$('#lab').addEventListener('webglcontextlost',serviceFallback);
function element(tag,text,className){const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;}
function render(){const query=$('#search').value.trim().toLocaleLowerCase('id');const result=files.filter(f=>(category==='Semua'||f.category===category)&&`${f.title} ${f.description} ${f.name}`.toLocaleLowerCase('id').includes(query));result.sort($('#sort').value==='name'?(a,b)=>a.title.localeCompare(b.title):$('#sort').value==='size'?(a,b)=>a.size-b.size:(a,b)=>b.createdAt.localeCompare(a.createdAt));$('#count').textContent=`${result.length} file`;const container=$('#files');container.replaceChildren();if(!result.length){const empty=element('div','','empty');empty.append(element('div','⌑','empty-symbol'),element('h3',files.length?'Belum ada yang cocok.':'Rak digitalnya siap diisi.'),element('p',files.length?'Coba kata pencarian lain atau pilih kategori Semua.':'Belum ada file yang diunggah. Admin dapat menambahkan ebook, aplikasi, dan file melalui panel Admin.'));container.append(empty);return;}for(const file of result){const row=element('article','','file-row'),info=element('div','','file-info');info.append(element('h3',file.title),element('p',`${file.category} · ${size(file.size)}${file.version?` · ${file.version}`:''}`));const detail=element('button','Detail','quiet');detail.addEventListener('click',()=>showDetail(file));const download=element('a','Unduh');download.href=`/download/${file.id}`;download.setAttribute('download',file.name);row.append(element('span',file.name.split('.').pop().toUpperCase(),'file-type'),info,detail,download);container.append(row);}}
async function load(){ $('#files').textContent='Memuat koleksi…';try{const response=await fetch('/api/files');if(!response.ok)throw Error();files=await response.json();render();}catch{$('#files').textContent='Koleksi belum dapat dimuat. Gunakan tombol Muat ulang koleksi untuk mencoba lagi.';$('#count').textContent='';}}
function showDetail(file){$('#detail-title').textContent=file.title;$('#detail-description').textContent=file.description||'Belum ada deskripsi untuk file ini.';const dl=$('#detail-meta');dl.replaceChildren();for(const [key,value]of [['Nama file',file.name],['Kategori',file.category],['Ukuran',size(file.size)],['Versi',file.version||'Tidak dicantumkan'],['Diunggah',new Date(file.createdAt).toLocaleDateString('id-ID')],['SHA-256',file.sha256]])dl.append(element('dt',key),element('dd',value));$('#detail-download').href=`/download/${file.id}`;$('#detail-download').setAttribute('download',file.name);$('#detail').showModal();}
$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.dispatchEvent(new CustomEvent('repository-category-change',{detail:{category}}));render();}));$('#reload').addEventListener('click',load);
$('#admin-open').addEventListener('click',()=>$('#admin').showModal());$('#admin-close').addEventListener('click',()=>$('#admin').close());$('#detail-close').addEventListener('click',()=>$('#detail').close());$('#admin').addEventListener('close',()=>{$('#upload').elements.token.value='';});
mountUploads(load);load();
