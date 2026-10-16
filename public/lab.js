import * as THREE from '/vendor/three.module.js';
import { mountJourney } from './lab-controls.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#lab');
const viewport = $('.lab-viewport');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'low-power'});
} catch {
  $('#lab-loading').textContent = 'Tampilan 3D membutuhkan WebGL. Aktifkan akselerasi grafis browser, lalu muat ulang. Repository tetap bisa digunakan.';
  document.body.dataset.webgl='unavailable';
  document.querySelectorAll('.lab-actions button:not(#computer-open),.lab-camera button,#motion').forEach(button => button.disabled = true);
}
if (renderer) initLab();

function initLab() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eeeee5');
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 90);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene.add(new THREE.HemisphereLight('#fff4dd', '#869791', 1.8));
  const sunlight = new THREE.DirectionalLight('#fff1d6', 3.0);
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
  const beveled = new Map();
  function softBox(x,y,z,w,h,d,color,parent=scene) {
    const key=[w,h,d].join('/');
    if(!beveled.has(key)) {
      const r=Math.min(w,h,d)*.16,shape=new THREE.Shape();
      shape.moveTo(-w/2+r,-h/2+r);shape.lineTo(w/2-r,-h/2+r);shape.lineTo(w/2-r,h/2-r);shape.lineTo(-w/2+r,h/2-r);shape.closePath();
      const geometry=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r});
      geometry.translate(0,0,-d/2+r);geometry.computeVertexNormals();beveled.set(key,geometry);
    }
    return mesh(beveled.get(key),mat(color),[x,y,z],parent);
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
  function screenTexture(on=true,services=false) {
    const c=document.createElement('canvas');c.width=640;c.height=400;const ctx=c.getContext('2d');
    ctx.fillStyle=on?'#173e50':'#17262d';ctx.fillRect(0,0,640,400);
    if(on){ctx.fillStyle='#b6dae1';ctx.font='500 26px sans-serif';ctx.fillText('LAB / TKJ',35,48);ctx.fillStyle='#8fb4be';ctx.font='18px sans-serif';ctx.fillText('Belajar dengan mencoba.',35,83);
      ctx.strokeStyle='#f0c856';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(133,210);ctx.lineTo(320,210);ctx.lineTo(320,300);ctx.lineTo(510,300);ctx.stroke();
      for(const [x,y] of [[90,170],[280,170],[470,260]]){ctx.fillStyle='#b8d3d4';ctx.fillRect(x,y,80,52);ctx.fillStyle='#31718a';ctx.fillRect(x+7,y+7,66,35);ctx.fillStyle='#b8d3d4';ctx.fillRect(x+33,y+52,14,13);ctx.fillRect(x+22,y+64,36,5);}
      ctx.fillStyle='#b6dae1';ctx.font='16px sans-serif';ctx.fillText('PC 01',100,258);ctx.fillText('SWITCH',285,258);ctx.fillText('PC 02',480,350);
    }
    if(services){
      ctx.fillStyle='#f3f1e9';ctx.fillRect(0,0,640,400);ctx.fillStyle='#255c72';ctx.font='700 20px sans-serif';ctx.fillText('LAB / TKJ',24,45);
      ctx.fillStyle='#526366';ctx.font='20px sans-serif';ctx.fillText('Pilih layanan',496,45);
      document.querySelectorAll('#computer a').forEach((link,index)=>{
        const y=60+index*108;ctx.fillStyle='#c3cabc';ctx.fillRect(24,y,592,2);
        ctx.fillStyle='#233a3d';ctx.font='600 30px sans-serif';ctx.fillText(link.querySelector('.service-name').textContent,38,y+46);
        ctx.fillStyle='#526366';ctx.font='19px sans-serif';ctx.fillText(link.querySelector('.service-address').textContent,38,y+75);
        ctx.fillStyle='#255c72';ctx.font='32px sans-serif';ctx.fillText('↗',565,y+58);
      });
    }
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  const litScreen = new THREE.MeshBasicMaterial({map: screenTexture(true)});
  const darkScreen = new THREE.MeshBasicMaterial({map: screenTexture(false)});
  const menuScreen = new THREE.MeshBasicMaterial({map: screenTexture(true,true)});
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
  for(const key of ['assembly','network','workstation','repository']) {const group=new THREE.Group();group.userData.station=key;scene.add(group);stations[key]=group;}
  const woodCanvas=document.createElement('canvas');woodCanvas.width=512;woodCanvas.height=512;
  const woodContext=woodCanvas.getContext('2d');woodContext.fillStyle='#d9b47f';woodContext.fillRect(0,0,512,512);
  for(let i=0;i<130;i++){woodContext.strokeStyle=`rgba(100,61,25,${.025+(i%5)*.01})`;woodContext.lineWidth=.5+(i%3)*.4;woodContext.beginPath();for(let x=0;x<=512;x+=16){const y=i*4+Math.sin(x*.012+i)*2; x?woodContext.lineTo(x,y):woodContext.moveTo(x,y);}woodContext.stroke();}
  const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;woodTexture.repeat.set(2,1);
  const woodMaterial=new THREE.MeshStandardMaterial({map:woodTexture,roughness:.6});
  function desk(x,z,w,parent){
    softBox(x,1.27,z,w,.12,1.3,palette.wood,parent).material=woodMaterial;
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
    const display=mesh(new THREE.PlaneGeometry(1.04,.65),screens.length?litScreen:menuScreen,[x,2.015,z+.04],parent);screens.push(display);
    box(x+.48,1.66,z+.042,.026,.012,.01,'#b7e1bb',parent,{emissive:'#7dcf98',emissiveIntensity:.5});
  }
  function chair(x,z,parent){
    cylinder(x,.58,z,.08,1,'#8c9998',parent);
    const seat=softBox(x,.84,z,.68,.13,.62,palette.blue,parent);seat.rotation.x=-.04;
    softBox(x,1.24,z+.31,.68,.68,.09,palette.blue,parent);
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

  // Storage and workshop tools connect the physical room to the final repository chapter.
  const archive=stations.repository;
  softBox(3.55,.74,.75,2.1,1.42,.06,palette.blue,archive);
  for(const x of [2.53,4.57])softBox(x,.74,1.25,.07,1.42,1.05,palette.blue,archive);
  for(const y of [.12,.55,.98,1.43])box(3.55,y,1.25,2.04,.045,1.05,'#244f5c',archive);
  softBox(3.55,1.49,1.25,2.25,.12,1.18,palette.wood,archive).material=woodMaterial;
  const drawers=['Ebook','Aplikasi','File'].map((category,index)=>{
    const group=new THREE.Group();group.position.set(3.55,1.18-index*.43,1.8);archive.add(group);
    softBox(0,0,0,1.94,.35,.045,'#376d7b',group);
    box(0,-.05,.06,.46,.045,.07,'#a3b0a9',group,{metalness:.55});
    const tab=label(`0${index+1} / ${category.toUpperCase()}`,1.02,.12);tab.position.set(0,.075,.026);group.add(tab);
    box(0,-.145,-.4,1.84,.04,.8,'#244f5c',group);
    for(const x of [-.9,.9])box(x,-.005,-.4,.035,.26,.8,'#55818a',group);
    box(0,-.005,-.8,1.84,.26,.035,'#55818a',group);
    if(category==='Ebook'){
      for(let i=0;i<3;i++){
        box(-.35,-.1+i*.065,-.4,.65,.045,.5,'#eee9d7',group);
        box(-.35,-.075+i*.065,-.4,.68,.012,.53,i%2?'#c9a85a':'#477a83',group);
      }
      box(.45,-.06,-.4,.5,.12,.55,'#d6bc8a',group);
    }else if(category==='Aplikasi'){
      for(let i=0;i<3;i++){
        box(-.58+i*.58,-.06,-.4,.45,.13,.54,i===1?'#d0aa4e':'#6f989d',group);
        const cover=label(['INSTALL','TOOLS','SETUP'][i],.35,.1);cover.rotation.x=-Math.PI/2;cover.position.set(-.58+i*.58,.007,-.4);group.add(cover);
      }
    }else{
      for(let i=0;i<3;i++){
        box(-.35+i*.3,-.1+i*.055,-.42,.78,.035,.53,i%2?'#e6e2d0':'#c7b37e',group);
        box(-.57+i*.3,-.077+i*.055,-.68,.22,.012,.12,'#d6bc8a',group);
      }
    }
    return {category,group,closedZ:group.position.z,progress:0,target:0,from:0,start:0,duration:450};
  });
  for(let i=0;i<6;i++){
    const book=softBox(2.75+i*.16,1.87,1.25,.13,.65,.51,i%2?'#d6bc8a':'#e7e4d6',archive);book.rotation.z=i===5?-.1:0;
    box(2.75+i*.16,1.88,1.513,.08,.03,.008,palette.blue,archive);
  }
  softBox(4.12,1.73,1.25,.68,.35,.58,'#e4e4d8',archive);
  box(4.12,1.74,1.55,.48,.035,.012,palette.metal,archive);
  box(4.12,1.91,1.15,.46,.015,.4,'#fffdf3',archive);
  const archiveSign=label('REPOSITORY',1.35,.12);archiveSign.position.set(3.55,1.49,1.85);archive.add(archiveSign);
  // Bench accessories use real scale relationships so close camera views still read as a lab.
  for(let i=0;i<4;i++)cylinder(-2.78+i*.27,1.48,1.19,.025,.045,'#b4bcae',stations.assembly);
  box(-.7,1.42,1.1,.33,.14,.24,'#d3b04f',stations.assembly);
  box(-.7,1.5,1.1,.22,.012,.13,'#244c51',stations.assembly);
  cable([[-.8,1.45,1.2],[-1.1,1.4,1.4],[-1.2,1.42,1.75],[-.85,1.4,1.9]],'#d19d28',.012,stations.assembly);
  for(let i=0;i<3;i++)cable([[-2.8+i*.09,1.43,1.21],[-2.9+i*.09,1.64,1.3],[-2.8+i*.09,1.57,1.55]],i%2?'#bd7749':'#cfb455',.009,stations.assembly);
  softBox(-3.5,.64,1.55,.48,1.1,1.05,'#536b6d',stations.assembly);
  for(let i=0;i<3;i++){box(-3.5,.35+i*.3,2.09,.42,.25,.025,'#38545b',stations.assembly);box(-3.5,.4+i*.3,2.12,.22,.025,.03,'#c4c9bb',stations.assembly);}
  const lampBase=cylinder(-3.13,1.38,1.03,.15,.06,palette.metal,stations.assembly);
  cable([[-3.13,1.4,1.03],[-3.13,2.05,1.03],[-2.7,2.28,1.03]],palette.metal,.025,stations.assembly);
  const shade=mesh(new THREE.ConeGeometry(.18,.24,20,1,true),mat('#d0ac53',{side:THREE.DoubleSide}),[-2.7,2.17,1.03],stations.assembly);
  const bulb=mesh(new THREE.SphereGeometry(.07,12,8),mat('#fff0b1',{emissive:'#ffe7a0',emissiveIntensity:.8}),[-2.7,2.1,1.03],stations.assembly);
  const deskLight=new THREE.PointLight('#ffe2a0',.45,2.5,2);deskLight.position.set(-2.7,2.05,1.03);scene.add(deskLight);
  box(.4,.45,-3.65,1.1,.15,.05,'#d6d7c9',room);
  for(let i=0;i<4;i++){box(.04+i*.24,.45,-3.61,.13,.1,.03,'#f4f3e6',room);box(.04+i*.24,.45,-3.588,.05,.012,.006,'#526564',room);}
  cable([[-.55,1.35,-2.78],[-.55,.4,-3.45],[.35,.4,-3.56]],'#496678',.016,stations.workstation);
  const clockFace=mesh(new THREE.CylinderGeometry(.29,.29,.045,40),mat('#f3eedc'),[.9,2.9,-3.68],room);clockFace.rotation.x=Math.PI/2;
  const clockHand=box(.9,2.98,-3.645,.018,.17,.018,palette.metal,room);box(.97,2.9,-3.64,.15,.018,.018,palette.metal,room);
  const ground=mesh(new THREE.PlaneGeometry(150,150),mat('#eeeee5'),[0,-.43,0]);ground.rotation.x=-Math.PI/2;ground.castShadow=false;

  mountJourney({THREE,canvas,viewport,renderer,scene,camera,stations,room,mat,lights,path,packet,marker,
    screens,litScreen,darkScreen,menuScreen,drawers,parts:[motherboard,cpu,cooler,ram],partOrigins});
}
