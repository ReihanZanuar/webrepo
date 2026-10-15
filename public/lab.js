import * as THREE from '/vendor/three.module.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#lab');
const viewport = $('.lab-viewport');
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduceQuery.matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'low-power'});
} catch {
  $('#lab-loading').textContent = 'Tampilan 3D membutuhkan WebGL. Aktifkan akselerasi grafis browser, lalu muat ulang. Repository tetap bisa digunakan.';
  document.querySelectorAll('.lab-tabs button,.lab-camera button,#motion').forEach(button => button.disabled = true);
}
if (renderer) initLab();

function initLab() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8e9e1');
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 90);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  scene.add(new THREE.HemisphereLight('#fff4dd', '#9bada9', 2.1));
  const sunlight = new THREE.DirectionalLight('#fff1d6', 3.2);
  sunlight.position.set(-4, 10, 6);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, {left: -9, right: 9, top: 9, bottom: -9, near: .1, far: 30});
  sunlight.shadow.normalBias = .025;
  scene.add(sunlight);
  const fill = new THREE.DirectionalLight('#d6e8f1', 1.2);
  fill.position.set(8, 5, -3); scene.add(fill);

  const materials = new Map();
  function mat(color, options = {}) {
    const key = color + JSON.stringify(options);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness: .72, ...options}));
    return materials.get(key);
  }
  const palette = {wood: '#d1a66e', metal: '#344b52', blue: '#2a627b', cream: '#f0ecdf', green: '#2e6755', yellow: '#e8b735'};
  function mesh(geometry, material, position, parent = scene) {
    const obj = new THREE.Mesh(geometry, material);
    obj.position.set(...position); obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
  }
  function box(x,y,z,w,h,d,color,parent=scene,options={}) {
    return mesh(new THREE.BoxGeometry(w,h,d),mat(color,options),[x,y,z],parent);
  }
  function cylinder(x,y,z,r,h,color,parent=scene) {
    return mesh(new THREE.CylinderGeometry(r,r,h,20),mat(color),[x,y,z],parent);
  }
  function cable(points,color,radius=.022,parent=scene) {
    const curve = new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)));
    const tube = mesh(new THREE.TubeGeometry(curve,40,radius,6,false),mat(color),[0,0,0],parent);
    return {curve,tube};
  }
  function label(text,width,height,color='#243f48',background='#eeeade') {
    const c = document.createElement('canvas'); c.width=512;c.height=128;
    const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.font='600 42px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,66);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture}));
  }
  function screenTexture(on=true) {
    const c=document.createElement('canvas');c.width=640;c.height=400;const ctx=c.getContext('2d');
    ctx.fillStyle=on?'#173e50':'#17262d';ctx.fillRect(0,0,640,400);
    if(on){ctx.fillStyle='#b6dae1';ctx.font='500 26px sans-serif';ctx.fillText('LAB / TKJ',35,48);ctx.fillStyle='#8fb4be';ctx.font='18px sans-serif';ctx.fillText('Belajar dengan mencoba.',35,83);
      ctx.strokeStyle='#f0c856';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(133,210);ctx.lineTo(320,210);ctx.lineTo(320,300);ctx.lineTo(510,300);ctx.stroke();
      for(const [x,y] of [[90,170],[280,170],[470,260]]){ctx.fillStyle='#b8d3d4';ctx.fillRect(x,y,80,52);ctx.fillStyle='#31718a';ctx.fillRect(x+7,y+7,66,35);ctx.fillStyle='#b8d3d4';ctx.fillRect(x+33,y+52,14,13);ctx.fillRect(x+22,y+64,36,5);}
      ctx.fillStyle='#b6dae1';ctx.font='16px sans-serif';ctx.fillText('PC 01',100,258);ctx.fillText('SWITCH',285,258);ctx.fillText('PC 02',480,350);
    }
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  const litScreen = new THREE.MeshBasicMaterial({map: screenTexture(true)});
  const darkScreen = new THREE.MeshBasicMaterial({map: screenTexture(false)});
  const room = new THREE.Group(); scene.add(room);
  box(0,-.22,0,10.5,.4,7.8,'#b6ad98',room);
  box(0,-.005,0,10.35,.06,7.65,'#dcd9cb',room);
  // Tile joints are physical floor details, not a page-wide decorative grid.
  for(let x=-4.5;x<=4.5;x+=1.5) box(x,.029,0,.014,.003,7.6,'#bdbeb4',room);
  for(let z=-3;z<=3;z+=1.5) box(0,.03,z,10.3,.003,.014,'#bdbeb4',room);
  box(0,1.75,-3.8,10.5,3.5,.15,palette.cream,room);
  box(-5.2,.4,0,.15,.8,7.7,'#e9e5d7',room);
  for(const z of [-2.6,-.1,2.4]) {
    box(-5.2,2.04,z,.13,2.5,.07,palette.metal,room);
    box(-5.2,2.04,z+1,.13,2.5,.07,palette.metal,room);
    for(const y of [.8,2,3.3]) box(-5.2,y,z+.5,.13,.065,1.07,palette.metal,room);
  }
  box(-5.2,3.4,0,.18,.2,7.7,palette.cream,room);
  box(0,.13,-3.66,10.3,.2,.08,'#b9b8ad',room);
  const sign=label('LABORATORIUM / TKJ',3,.6);sign.position.set(-1.2,2.9,-3.7);room.add(sign);
  const board=box(2.8,2.5,-3.66,2.4,.85,.08,palette.blue,room);
  for(let x=1.8;x<3.9;x+=.2)for(let y=2.2;y<2.9;y+=.16)box(x,y,-3.609,.026,.026,.012,'#99b2b7',room);
  for(let i=0;i<5;i++){box(2+i*.34,2.5,-3.57,.055,.38,.055,'#b1bab5',room);box(2+i*.34,2.73,-3.57,.1,.14,.09,palette.yellow,room);}
  box(-3.6,2.4,-3.57,2,.12,.4,palette.wood,room);
  for(let i=0;i<7;i++)box(-4.4+i*.2,2.65,-3.55,.13,.45,.3,i%2?palette.blue:'#e2decd',room);

  const stations={};
  for(const key of ['assembly','network','workstation']) {const group=new THREE.Group();group.userData.station=key;scene.add(group);stations[key]=group;}
  function desk(x,z,w,parent){
    box(x,1.27,z,w,.12,1.3,palette.wood,parent);
    box(x,1.18,z,w-.08,.07,1.2,'#b48b5b',parent);
    for(const dx of [-w/2+.12,w/2-.12])for(const dz of [-.48,.48])box(x+dx,.6,z+dz,.07,1.2,.07,palette.metal,parent);
    box(x,.27,z-.48,w-.2,.055,.055,palette.metal,parent);
    const badge=label(parent===stations.assembly?'01 / PERAKITAN':'03 / WORKSTATION',1.2,.18);
    badge.position.set(x,1.16,z+.655);parent.add(badge);
  }
  function keyboard(x,y,z,parent){
    box(x,y,z,.85,.035,.29,'#c5c9c3',parent);
    for(let row=0;row<4;row++)for(let col=0;col<12;col++)box(x-.37+col*.065,y+.025,z-.105+row*.06,.049,.017,.042,'#edf0e7',parent);
    box(x,y+.027,z+.1,.32,.02,.036,'#c9d6d1',parent);
  }
  const screens=[];
  function monitor(x,z,parent){
    box(x,1.36,z,.4,.035,.25,palette.metal,parent);box(x,1.61,z,.065,.5,.065,palette.metal,parent);
    box(x,1.99,z,1.14,.76,.075,'#263940',parent);
    const display=mesh(new THREE.PlaneGeometry(1.04,.65),litScreen,[x,2.015,z+.04],parent);screens.push(display);
    box(x+.48,1.66,z+.042,.026,.012,.01,'#b7e1bb',parent,{emissive:'#7dcf98',emissiveIntensity:.5});
  }
  function chair(x,z,parent){
    cylinder(x,.58,z,.08,1,'#8c9998',parent);
    const seat=box(x,.84,z,.68,.13,.62,palette.blue,parent);seat.rotation.x=-.04;
    box(x,1.24,z+.31,.68,.68,.09,palette.blue,parent);
    box(x,1.23,z+.365,.55,.5,.035,'#3f7789',parent);
    for(const side of [-1,1]){box(x+side*.39,.93,z,.045,.43,.045,palette.metal,parent);box(x+side*.39,1.12,z,.09,.05,.4,palette.metal,parent);}
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leg=box(x+Math.sin(a)*.21,.12,z+Math.cos(a)*.21,.045,.06,.45,palette.metal,parent);leg.rotation.y=a;const wheel=cylinder(x+Math.sin(a)*.42,.07,z+Math.cos(a)*.42,.07,.05,'#273d44',parent);wheel.rotation.z=Math.PI/2;}
  }
  desk(-1.6,-2.55,4.6,stations.workstation);
  for(const x of [-2.85,-.55]){
    monitor(x,-2.8,stations.workstation);keyboard(x,1.36,-2.24,stations.workstation);
    const mouse=mesh(new THREE.SphereGeometry(.09,16,10),mat('#344b52'),[x+.66,1.38,-2.23],stations.workstation);mouse.scale.set(.7,.45,1);
    box(x+.8,.48,-2.75,.42,.88,.7,palette.metal,stations.workstation);
    for(let i=0;i<5;i++)box(x+.8,.3+i*.075,-2.391,.26,.022,.015,'#172e36',stations.workstation);
    box(x+.8,.82,-2.389,.04,.04,.015,palette.yellow,stations.workstation);
    chair(x,-1.25,stations.workstation);
  }
  desk(-1.8,1.55,3.5,stations.assembly);
  box(-1.8,1.345,1.55,2.8,.015,.92,'#293f46',stations.assembly);
  // Open horizontal chassis exposes the components instead of hiding them inside a solid box.
  const pc=new THREE.Group();pc.position.set(-2.35,1.39,1.55);stations.assembly.add(pc);
  box(0,0,0,1.25,.08,.85,palette.metal,pc);
  box(0,.25,-.41,1.25,.5,.045,'#6b7d7f',pc);
  box(-.6,.22,0,.05,.44,.85,'#6b7d7f',pc);
  box(.6,.15,0,.05,.3,.85,'#6b7d7f',pc);
  const motherboard=new THREE.Group();motherboard.position.y=.08;pc.add(motherboard);
  box(0,0,0,1.08,.035,.7,palette.green,motherboard);
  for(let i=0;i<14;i++)box(-.5+i*.075,.021,.25,.012,.006,.33,'#b7b383',motherboard);
  for(let i=0;i<5;i++)box(-.4+i*.16,.027,-.2,.09,.04,.09,'#233a38',motherboard);
  const cpu=new THREE.Group();cpu.position.set(-.15,.05,0);motherboard.add(cpu);
  box(0,0,0,.28,.04,.28,'#becac5',cpu,{metalness:.65});
  const cooler=new THREE.Group();cooler.position.set(-.15,.18,0);motherboard.add(cooler);
  for(let i=0;i<9;i++)box(-.14+i*.035,0,0,.018,.2,.3,'#899d9d',cooler,{metalness:.55});
  const fan=cylinder(0,.13,0,.14,.04,'#20383f',cooler);
  for(let i=0;i<5;i++){const blade=box(0,.16,0,.2,.015,.045,'#657f86',cooler);blade.rotation.y=i*Math.PI/5;}
  const ram=new THREE.Group();ram.position.set(.34,.1,0);motherboard.add(ram);
  for(const x of [-.055,.055]){box(x,0,0,.025,.17,.52,'#365f4b',ram);for(let i=0;i<5;i++)box(x+.016,.02,-.2+i*.09,.01,.08,.05,'#1c3334',ram);}
  const lid=box(0,.52,0,1.25,.04,.85,'#9da9a6',pc);
  lid.visible=false;
  const partOrigins=[motherboard,cpu,cooler,ram].map(part=>part.position.clone());
  const screwdriver=box(-.62,1.39,1.6,.045,.045,.45,'#b4bfba',stations.assembly,{metalness:.6});screwdriver.rotation.y=.3;
  box(-.55,1.4,1.84,.09,.08,.2,palette.yellow,stations.assembly);
  for(let i=0;i<3;i++){box(-.65+i*.12,1.37,1.24,.08,.025,.15,'#7b9990',stations.assembly);}
  const stool=cylinder(-1.8,.8,2.7,.35,.13,palette.blue,stations.assembly);
  cylinder(-1.8,.4,2.7,.065,.8,palette.metal,stations.assembly);
  cylinder(-1.8,.1,2.7,.3,.06,palette.metal,stations.assembly);

  const rack=stations.network;const rx=3.15,rz=-2.65;
  box(rx,.12,rz,1.45,.2,1.1,palette.metal,rack);
  for(const x of [-.68,.68])for(const z of [-.49,.49])box(rx+x,1.48,rz+z,.065,2.8,.065,'#243c44',rack);
  box(rx,2.92,rz,1.5,.12,1.13,'#314b54',rack);
  box(rx,1.5,rz-.51,1.4,2.7,.04,'#334e58',rack);
  const lights=[];
  for(let row=0;row<6;row++){
    const y=.44+row*.38;
    box(rx,y,rz,1.28,.29,.9,row<2?'#849193':'#59737d',rack);
    box(rx,y,rz+.46,1.23,.23,.025,'#304b56',rack);
    for(let port=0;port<10;port++){
      const x=rx-.51+port*.112;
      box(x,y,rz+.48,.074,.063,.025,'#bfc8bc',rack);box(x,y+.005,rz+.495,.051,.035,.01,'#243b43',rack);
      if(port<2)lights.push(box(x,y+.075,rz+.495,.025,.014,.01,'#9daa9b',rack));
    }
  }
  for(let i=0;i<7;i++)cable([[rx-.5+i*.12,2.33,rz+.51],[rx-.5+i*.12,2.13,rz+.66],[rx-.5+i*.12,1.8,rz+.7],[rx-.5+i*.12,1.58,rz+.51]],i%2?palette.blue:palette.yellow,.014,rack);
  const rackLabel=label('02 / JARINGAN',1.2,.18);rackLabel.position.set(rx,2.76,rz+.57);rack.add(rackLabel);
  const path=cable([[-.55,1.45,-2.75],[.1,1.34,-2.15],[1.1,.12,-1.65],[2.55,.12,-1.45],[3.2,1.58,-2.12]],palette.yellow,.028);
  path.tube.visible=false;
  const packet=mesh(new THREE.SphereGeometry(.075,14,10),new THREE.MeshBasicMaterial({color:'#fff2aa'}),[0,0,0]);packet.visible=false;
  const marker = mesh(new THREE.TorusGeometry(.32,.018,6,40),new THREE.MeshBasicMaterial({color:'#a76a17'}),[0,.06,0]);marker.rotation.x=-Math.PI/2;marker.visible=false;
  function plant(x,z){cylinder(x,.28,z,.24,.55,'#c7bda6');cylinder(x,.57,z,.21,.025,'#645d49');for(let i=0;i<7;i++){const leaf=mesh(new THREE.SphereGeometry(.22,10,8),mat(i%2?'#657d5c':'#839671'),[x+Math.sin(i*2)*.2,.9+i*.07,z+Math.cos(i*2)*.18]);leaf.scale.set(.55,1.5,.7);leaf.rotation.z=Math.sin(i)*.4;}}
  plant(-4.35,2.7);plant(4.45,-3.05);

  const presets={
    overview:{position:[11,9,14],look:[0,1,0],title:'Benda kecil.\nIde besar.',body:'Klik perangkat di dalam ruang atau pilih area di atas. Setiap meja punya praktik yang bisa kamu coba.',label:'Pandangan seluruh lab'},
    assembly:{position:[2.5,5.5,7],look:[-1.9,1.45,1.45],title:'Kenali isi\nkomputermu.',body:'Angkat komponen untuk melihat susunannya. Pilih CPU atau RAM untuk menemukan perannya.',label:'01 / Meja perakitan'},
    network:{position:[7,4.7,4.5],look:[2.6,1.4,-2.1],title:'Sambungkan.\nKirim. Terima.',body:'Hubungkan workstation ke switch, lalu kirim paket data simulasi melalui kabel LAN.',label:'02 / Praktik jaringan'},
    workstation:{position:[3,4.5,4.2],look:[-1.65,1.4,-2.35],title:'Siapkan meja\nbelajarmu.',body:'Nyalakan monitor untuk melihat diagram jaringan sederhana, kemudian ambil materi praktik di repository.',label:'03 / Workstation'}
  };
  const state={station:'overview',exploded:false,connected:false,power:true,sending:false,hover:null};
  let targetPos=new THREE.Vector3(...presets.overview.position),targetLook=new THREE.Vector3(...presets.overview.look),look=targetLook.clone();
  camera.position.copy(targetPos);camera.lookAt(look);
  let frame=0,visible=true,lastTime=0,sendStart=0,explosion=0,transitionUntil=0;
  const names={assembly:'Meja perakitan',network:'Rak jaringan',workstation:'Meja belajar'};
  function feedback(text){$('#lab-feedback').textContent=text;}
  function action(text,fn,id,pressed){const button=document.createElement('button');button.textContent=text;if(id)button.id=id;if(pressed!==undefined)button.setAttribute('aria-pressed',String(pressed));button.addEventListener('click',fn);$('#lab-actions').append(button);return button;}
  function updateActions(){
    const container=$('#lab-actions');container.replaceChildren();
    if(state.station==='overview') {
      action('Mulai dari perakitan',()=>select('assembly'),'start-lab');
      feedback('Tip: perangkat juga bisa dipilih langsung di dalam ruang.');
    } else if(state.station==='assembly') {
      action(state.exploded?'Satukan komponen':'Angkat komponen',()=>{state.exploded=!state.exploded;updateActions();feedback(state.exploded?'Komponen dipisahkan untuk memperlihatkan CPU, pendingin, RAM, dan motherboard.':'Komponen kembali ke dudukannya.');wake();},'explode-pc',state.exploded);
      action('Periksa CPU',()=>{selectPart(cpu);feedback('CPU memproses instruksi. Pendingin di atasnya membantu membuang panas saat komputer bekerja.');},'inspect-cpu');
      action('Periksa RAM',()=>{selectPart(ram);feedback('RAM menyimpan data sementara yang sedang dipakai program. Data ini tidak disimpan ketika listrik mati.');},'inspect-ram');
      feedback('Klik Angkat komponen untuk membedah susunan komputer.');
    } else if(state.station==='network') {
      action(state.connected?'Lepas kabel LAN':'Sambungkan kabel LAN',()=>{state.connected=!state.connected;state.sending=false;path.tube.visible=state.connected;packet.visible=false;updateLights();updateActions();feedback(state.connected?'Kabel terpasang. Indikator link menyala. Sekarang coba kirim paket.':'Kabel dilepas. Jalur data terputus.');wake();},'connect-lan',state.connected);
      const send=action('Kirim paket data',()=>{if(!state.connected||state.sending)return;state.sending=true;sendStart=performance.now();send.disabled=true;feedback(paused?'Paket terkirim ke switch. Gerakan dinonaktifkan.':'Paket bergerak dari workstation menuju switch…');if(paused)finishPacket();else wake();},'send-packet');send.disabled=!state.connected||state.sending;
      feedback(state.connected?'Link aktif. Coba kirim satu paket data.':'Belum terhubung. Pasang kabel LAN terlebih dahulu.');
    } else {
      action(state.power?'Matikan monitor':'Nyalakan monitor',()=>{state.power=!state.power;screens.forEach(screen=>screen.material=state.power?litScreen:darkScreen);updateActions();feedback(state.power?'Monitor aktif. Diagram menunjukkan dua komputer yang dihubungkan melalui switch.':'Monitor dimatikan. Tekan Nyalakan monitor untuk kembali melihat diagram.');wake();},'power-monitor',state.power);
      const link=document.createElement('a');link.href='#repository';link.textContent='Cari materi praktik';container.append(link);
      feedback('Layar menampilkan diagram pengenalan jaringan lokal.');
    }
  }
  const selectionBox=new THREE.BoxHelper(cpu,'#e9b52e');selectionBox.visible=false;scene.add(selectionBox);
  function selectPart(part){selectionBox.setFromObject(part);selectionBox.visible=true;transitionUntil=performance.now()+2500;wake();}
  function updateLights(){lights.forEach(light=>{light.material=mat(state.connected?'#7fbd85':'#9daa9b',state.connected?{emissive:'#4b9a55',emissiveIntensity:.7}:{});});}
  function select(key){
    state.station=key;const preset=presets[key];targetPos.set(...preset.position);targetLook.set(...preset.look);selectionBox.visible=false;
    document.querySelectorAll('[data-station]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.station===key)));
    $('#scene-number').textContent=key==='overview'?'Selamat datang di lab':preset.label;
    $('#scene-title').textContent=preset.title;$('#scene-body').textContent=preset.body;$('#view-label').textContent=preset.label;
    updateActions();wake();
  }
  function finishPacket(){state.sending=false;packet.visible=false;feedback('Paket diterima switch. Simulasi pengiriman selesai.');const button=$('#send-packet');if(button)button.disabled=!state.connected;wake();}
  document.querySelectorAll('[data-station]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.station)));
  function rotate(delta){const offset=targetPos.clone().sub(targetLook);offset.applyAxisAngle(new THREE.Vector3(0,1,0),delta);targetPos.copy(targetLook).add(offset);wake();}
  function zoom(factor){const offset=targetPos.clone().sub(targetLook);const distance=THREE.MathUtils.clamp(offset.length()*factor,4,26);targetPos.copy(targetLook).add(offset.setLength(distance));wake();}
  $('#rotate-left').addEventListener('click',()=>rotate(-.22));$('#rotate-right').addEventListener('click',()=>rotate(.22));
  $('#zoom-in').addEventListener('click',()=>zoom(.85));$('#zoom-out').addEventListener('click',()=>zoom(1.18));$('#reset-view').addEventListener('click',()=>select(state.station));
  canvas.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();rotate(-.16);}if(event.key==='ArrowRight'){event.preventDefault();rotate(.16);}if(event.key==='+'||event.key==='=')zoom(.85);if(event.key==='-')zoom(1.18);});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let drag=null;
  function hit(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const intersections=raycaster.intersectObjects(Object.values(stations),true);if(!intersections.length)return null;let obj=intersections[0].object;while(obj&&!obj.userData.station)obj=obj.parent;return obj?.userData.station;}
  canvas.addEventListener('pointerdown',event=>{drag={x:event.clientX,startX:event.clientX,y:event.clientY,moved:false};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{
    if(drag){if(Math.abs(event.clientX-drag.startX)>5||Math.abs(event.clientY-drag.y)>8)drag.moved=true;rotate(-(event.clientX-drag.x)*.006);drag.x=event.clientX;return;}
    const key=hit(event);canvas.style.cursor=key?'pointer':'grab';const tooltip=$('#lab-hover');tooltip.hidden=!key;if(key)tooltip.textContent=`${names[key]} · klik untuk masuk`;
    if(state.hover!==key){state.hover=key;marker.visible=!!key;const p=key&&presets[key].look;if(p)marker.position.set(p[0],.07,p[2]);wake();}
  });
  canvas.addEventListener('pointerup',event=>{if(drag&&!drag.moved){const key=hit(event);if(key)select(key);}drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('pointerleave',()=>{$('#lab-hover').hidden=true;marker.visible=false;wake();});
  function updateMotion(){const button=$('#motion');button.textContent=paused?'Aktifkan gerakan':'Hentikan gerakan';button.setAttribute('aria-pressed',String(paused));if(paused&&state.sending)finishPacket();wake();}
  $('#motion').addEventListener('click',()=>{paused=!paused;updateMotion();});reduceQuery.addEventListener('change',()=>{paused=reduceQuery.matches;updateMotion();});
  function resize(){const width=viewport.clientWidth,height=viewport.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width<500?48:38;camera.updateProjectionMatrix();wake();}
  new ResizeObserver(resize).observe(viewport);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();},{rootMargin:'100px'}).observe(viewport);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();$('#lab-loading').hidden=false;$('#lab-loading').textContent='Koneksi grafis terputus. Muat ulang halaman untuk membuka lab kembali.';});
  function wake(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function render(time){
    frame=0;if(!visible||document.hidden)return;
    const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;const blend=paused?1:1-Math.exp(-7*dt);
    camera.position.lerp(targetPos,blend);look.lerp(targetLook,blend);camera.lookAt(look);
    const goal=state.exploded?1:0;explosion=paused?goal:THREE.MathUtils.lerp(explosion,goal,blend);
    [motherboard,cpu,cooler,ram].forEach((part,index)=>{part.position.copy(partOrigins[index]);part.position.y+=explosion*[.13,.22,.8,.5][index];});
    if(selectionBox.visible){selectionBox.update();if(time>transitionUntil)selectionBox.visible=false;}
    if(state.sending){const t=Math.min((time-sendStart)/2200,1);packet.visible=true;packet.position.copy(path.curve.getPointAt(t));if(t>=1)finishPacket();}
    renderer.render(scene,camera);
    const moving=camera.position.distanceToSquared(targetPos)>.00001||look.distanceToSquared(targetLook)>.00001||Math.abs(explosion-goal)>.001;
    if(moving||state.sending||selectionBox.visible)wake();
  }
  updateActions();updateMotion();resize();$('#lab-loading').hidden=true;canvas.dataset.ready='true';
}
