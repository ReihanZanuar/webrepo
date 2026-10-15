import { stops, sampleRoute, routePosition, clamp } from './camera-route.js';

export function mountJourney({THREE,canvas,viewport,renderer,scene,camera,stations,room,mat,lights,path,packet,marker,screens,litScreen,darkScreen,parts,partOrigins}) {
  const $=selector=>document.querySelector(selector);
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=media.matches,mode=media.matches?'click':'scroll';
  try {const saved=sessionStorage.getItem('tkj-explore-mode');if(!media.matches&&['click','scroll'].includes(saved))mode=saved;}catch{}
  const sections=stops.map(stop=>document.getElementById(stop.id));
  let anchors=[],frame=0,lastTime=0,route=0,destination=0,selected=0,yawOffset=0,targetYaw=0,zoom=1,targetZoom=1;
  let exploded=false,explosion=0,connected=false,power=true,sending=false,sendStart=0,highlightUntil=0,lost=false;
  let drag=null,hover=null;
  const selection=new THREE.BoxHelper(parts[1],'#d9a421');selection.visible=false;scene.add(selection);
  function measure(){anchors=sections.map(section=>section.offsetTop);}
  measure();route=destination=routePosition(scrollY,anchors);selected=Math.round(route);
  function wake(){if(!frame&&!document.hidden&&!lost)frame=requestAnimationFrame(render);}
  function updateChapter(index){
    selected=clamp(index,0,stops.length-1);
    document.body.dataset.segment=stops[selected].key;
    $('#view-label').textContent=stops[selected].label;
    document.querySelectorAll('[data-route]').forEach(link=>{
      if(Number(link.dataset.route)===selected)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
    });
  }
  function setMode(next,persist=true){
    mode=next;document.body.dataset.mode=mode;
    document.querySelectorAll('.explore-mode [data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
    $('#mode-hint').textContent=mode==='scroll'?'Scroll untuk mengikuti perjalanan. Klik tujuan untuk langsung menuju segmen.':'Pilih tujuan di bawah atau klik perangkat. Geser ruang untuk mengubah sudut.';
    if(mode==='click')destination=route;
    else if(!paused)destination=routePosition(scrollY,anchors);
    if(persist)try{sessionStorage.setItem('tkj-explore-mode',mode);}catch{}
    wake();
  }
  document.querySelectorAll('.explore-mode [data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
  function go(index,{history=true}={}){
    measure();destination=index;targetYaw=0;targetZoom=1;
    if(paused)route=destination;
    updateChapter(index);
    if(history&&location.hash!==`#${stops[index].id}`)window.history.pushState(null,'',`#${stops[index].id}`);
    window.scrollTo({top:anchors[index],behavior:paused?'instant':'smooth'});wake();
  }
  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    const index=stops.findIndex(stop=>`#${stop.id}`===link.getAttribute('href'));
    if(index>=0)link.addEventListener('click',event=>{event.preventDefault();go(index);if(link.classList.contains('skip'))$('#search').focus({preventScroll:true});});
  });
  window.addEventListener('popstate',()=>{const index=stops.findIndex(stop=>`#${stop.id}`===location.hash);go(index<0?0:index,{history:false});});
  window.addEventListener('scroll',()=>{if(mode==='scroll'&&!paused){destination=routePosition(scrollY,anchors);targetYaw=0;targetZoom=1;}wake();},{passive:true});
  new ResizeObserver(()=>{measure();if(mode==='scroll'&&!paused)destination=routePosition(scrollY,anchors);wake();}).observe(document.querySelector('main'));
  const feedback=(area,text)=>{$(`#${area}-feedback`).textContent=text;};
  $('#explode-pc').addEventListener('click',()=>{
    exploded=!exploded;$('#explode-pc').textContent=exploded?'Satukan komponen':'Angkat komponen';$('#explode-pc').setAttribute('aria-pressed',String(exploded));
    feedback('assembly',exploded?'Motherboard, CPU, pendingin, dan RAM terangkat untuk memperlihatkan susunannya.':'Komponen kembali ke dudukannya.');wake();
  });
  function inspect(part,text){exploded=true;$('#explode-pc').textContent='Satukan komponen';$('#explode-pc').setAttribute('aria-pressed','true');selection.setFromObject(part);selection.visible=true;highlightUntil=performance.now()+3000;feedback('assembly',text);wake();}
  $('#inspect-cpu').addEventListener('click',()=>inspect(parts[1],'CPU memproses instruksi. Pendingin di atasnya membantu membuang panas saat komputer bekerja.'));
  $('#inspect-ram').addEventListener('click',()=>inspect(parts[3],'RAM menampung data sementara yang sedang digunakan program. Data ini hilang ketika daya dimatikan.'));
  function finishPacket(){sending=false;packet.visible=false;$('#send-packet').disabled=!connected;feedback('network','Paket diterima switch. Simulasi pengiriman selesai.');wake();}
  $('#connect-lan').addEventListener('click',()=>{
    connected=!connected;sending=false;packet.visible=false;path.tube.visible=connected;
    lights.forEach(light=>light.material=mat(connected?'#7fbd85':'#9daa9b',connected?{emissive:'#4b9a55',emissiveIntensity:.7}:{}));
    $('#connect-lan').textContent=connected?'Lepas kabel LAN':'Sambungkan kabel LAN';$('#connect-lan').setAttribute('aria-pressed',String(connected));$('#send-packet').disabled=!connected;
    feedback('network',connected?'Kabel terpasang dan link aktif. Sekarang coba kirim satu paket data.':'Kabel dilepas. Jalur data terputus.');wake();
  });
  $('#send-packet').addEventListener('click',()=>{if(!connected||sending)return;sending=true;sendStart=performance.now();$('#send-packet').disabled=true;feedback('network','Paket bergerak dari workstation menuju switch…');if(paused)finishPacket();else wake();});
  $('#power-monitor').addEventListener('click',()=>{
    power=!power;screens.forEach(screen=>screen.material=power?litScreen:darkScreen);$('#power-monitor').textContent=power?'Matikan monitor':'Nyalakan monitor';$('#power-monitor').setAttribute('aria-pressed',String(power));
    feedback('workstation',power?'Monitor aktif. Diagram menunjukkan dua komputer yang dihubungkan melalui switch.':'Monitor dimatikan. Nyalakan untuk melihat diagram kembali.');wake();
  });
  function manual(){if(mode!=='click')setMode('click');}
  function rotate(delta){manual();const pose=sampleRoute(route);targetYaw=clamp(targetYaw+delta,-.55-pose.yaw,1.05-pose.yaw);wake();}
  function zoomBy(factor){manual();targetZoom=clamp(targetZoom*factor,.85,1.5);wake();}
  $('#rotate-left').addEventListener('click',()=>rotate(-.13));$('#rotate-right').addEventListener('click',()=>rotate(.13));
  $('#zoom-in').addEventListener('click',()=>zoomBy(.9));$('#zoom-out').addEventListener('click',()=>zoomBy(1.1));
  $('#reset-view').addEventListener('click',()=>{targetYaw=0;targetZoom=1;wake();});
  canvas.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();rotate(-.13);}if(event.key==='ArrowRight'){event.preventDefault();rotate(.13);}
    if(event.key==='+'||event.key==='='){event.preventDefault();zoomBy(.9);}if(event.key==='-'){event.preventDefault();zoomBy(1.1);}
  });
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function hit(event){
    const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    // Include room surfaces so selection cannot pass through a wall to hidden equipment.
    const intersection=raycaster.intersectObjects([room,...Object.values(stations)],true)[0];
    let obj=intersection?.object;while(obj&&!obj.userData.station)obj=obj.parent;
    return obj?.userData.station||null;
  }
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={startX:event.clientX,startY:event.clientY,lastX:event.clientX,moved:false};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{
    if(drag){const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
      if(Math.abs(dx)>7||Math.abs(dy)>7)drag.moved=true;
      if(drag.moved&&Math.abs(dx)>Math.abs(dy))rotate(-(event.clientX-drag.lastX)*.004);
      drag.lastX=event.clientX;return;
    }
    const key=hit(event),index=stops.findIndex(stop=>stop.key===key);const tooltip=$('#lab-hover');tooltip.hidden=index<0;
    if(index>=0)tooltip.textContent=`${stops[index].label} · klik untuk masuk`;
    canvas.style.cursor=key?'pointer':'grab';
    if(hover!==key){hover=key;marker.visible=index>=0;if(index>=0){const t=stops[index].target;marker.position.set(t[0],.065,t[2]);}wake();}
  });
  canvas.addEventListener('pointerup',event=>{if(drag&&!drag.moved){const key=hit(event),index=stops.findIndex(stop=>stop.key===key);if(index>=0)go(index);}drag=null;});
  canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('pointerleave',()=>{hover=null;marker.visible=false;$('#lab-hover').hidden=true;wake();});
  function updateMotion(){
    $('#motion').textContent=paused?'Aktifkan gerakan':'Hentikan gerakan';$('#motion').setAttribute('aria-pressed',String(paused));
    if(paused){destination=route;if(sending)finishPacket();}else if(mode==='scroll')destination=routePosition(scrollY,anchors);wake();
  }
  $('#motion').addEventListener('click',()=>{paused=!paused;updateMotion();});
  media.addEventListener('change',()=>{paused=media.matches;if(paused)setMode('click',false);updateMotion();});
  function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=matchMedia('(max-width:760px)').matches?43:40;camera.updateProjectionMatrix();measure();wake();}
  new ResizeObserver(resize).observe(viewport);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(sending&&performance.now()-sendStart>2600)finishPacket();wake();}});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;$('#lab-loading').hidden=false;$('#lab-loading').textContent='Koneksi grafis terputus. Muat ulang halaman untuk membuka lab kembali.';document.querySelectorAll('.lab-camera button,.lab-actions button,.explore-mode button').forEach(button=>button.disabled=true);});
  function render(time){
    frame=0;if(document.hidden||lost)return;
    const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
    const blend=paused?1:1-Math.exp(-6*dt);
    route=paused?destination:route+(destination-route)*blend;
    yawOffset+=(targetYaw-yawOffset)*blend;zoom+=(targetZoom-zoom)*blend;
    const pose=sampleRoute(route),look=new THREE.Vector3(...pose.target);
    const yaw=clamp(pose.yaw+yawOffset,-.55,1.05),distance=pose.radius*zoom;
    camera.position.set(look.x+Math.sin(yaw)*Math.cos(pose.elevation)*distance,look.y+Math.sin(pose.elevation)*distance,look.z+Math.cos(yaw)*Math.cos(pose.elevation)*distance);camera.lookAt(look);
    const goal=exploded?1:0;explosion=paused?goal:explosion+(goal-explosion)*blend;
    parts.forEach((part,index)=>{part.position.copy(partOrigins[index]);part.position.y+=explosion*[.13,.22,.8,.5][index];});
    if(selection.visible){selection.update();if(time>highlightUntil)selection.visible=false;}
    if(sending){const t=clamp((time-sendStart)/2600,0,1);packet.visible=true;packet.position.copy(path.curve.getPointAt(t));if(t>=1)finishPacket();}
    updateChapter(Math.round(route));$('#route-progress').style.width=`${route/(stops.length-1)*100}%`;
    renderer.render(scene,camera);
    canvas.dataset.route=route.toFixed(4);canvas.dataset.camera=camera.position.toArray().map(n=>n.toFixed(3)).join(',');canvas.dataset.station=stops[selected].key;
    if(Math.abs(route-destination)>.0001||Math.abs(yawOffset-targetYaw)>.0001||Math.abs(zoom-targetZoom)>.0001||Math.abs(explosion-goal)>.001||sending||selection.visible)wake();
  }
  setMode(mode,false);updateMotion();resize();updateChapter(selected);$('#lab-loading').hidden=true;canvas.dataset.ready='true';
  // Resolve direct anchor visits after layout, without changing the selected exploration mode.
  const initial=stops.findIndex(stop=>`#${stop.id}`===location.hash);
  if(initial>=0){
    route=destination=initial;
    const align=()=>requestAnimationFrame(()=>{measure();route=destination=initial;window.scrollTo({top:anchors[initial],behavior:'instant'});wake();});
    if(document.readyState==='complete')align();else window.addEventListener('load',align,{once:true});
  }
}
