import { stops, sampleRoute, routePosition, clamp, smooth } from './camera-route.js';

export function mountJourney({THREE,canvas,viewport,renderer,scene,camera,stations,room,mat,lights,path,packet,marker,screens,litScreen,darkScreen,menuScreen,drawers,parts,partOrigins}) {
  const $=selector=>document.querySelector(selector);
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=media.matches;
  const sections=stops.map(stop=>document.getElementById(stop.id));
  let anchors=[],frame=0,lastTime=0,route=0,destination=0,selected=0,yawOffset=0,targetYaw=0,zoom=1,targetZoom=1;
  let exploded=false,explosion=0,connected=false,power=true,sending=false,sendStart=0,highlightUntil=0,lost=false;
  let drag=null,hover=null;
  let computerFocus=0,computerTarget=0;
  const computer=$('#computer'),preview=$('#service-preview');
  let previewLink=null;
  let repositoryCategory=$('[data-category][aria-pressed=true]').dataset.category;
  document.addEventListener('repository-category-change',event=>{
    const category=event.detail?.category;
    if(category!=='Semua'&&!drawers.some(drawer=>drawer.category===category))return;
    repositoryCategory=category;wake();
  });
  let travel=null,scrollTimer=0,lastWheel=0,wheelLatched=false,wheelDelta=0,touch=null;
  const selection=new THREE.BoxHelper(parts[1],'#d9a421');selection.visible=false;scene.add(selection);
  function measure(){anchors=sections.map(section=>section.offsetTop);}
  measure();route=destination=Math.round(routePosition(scrollY,anchors));selected=destination;
  function wake(){if(!frame&&!document.hidden&&!lost)frame=requestAnimationFrame(render);}
  function updateChapter(index){
    selected=clamp(index,0,stops.length-1);
    document.body.dataset.segment=stops[selected].key;
    $('#view-label').textContent=stops[selected].label;
    document.querySelectorAll('[data-route]').forEach(link=>{
      if(Number(link.dataset.route)===selected)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
    });
  }
  function go(index,{history=true}={}){
    leaveComputer(false);
    index=clamp(index,0,stops.length-1);measure();destination=index;targetYaw=0;targetZoom=1;
    clearTimeout(scrollTimer);
    if(paused||(Math.abs(route-index)<.0001&&Math.abs(scrollY-anchors[index])<2)){travel=null;route=destination;window.scrollTo({top:anchors[index],behavior:'instant'});}
    else travel={from:route,y:scrollY,to:anchors[index],start:performance.now(),duration:800};
    updateChapter(index);
    if(history&&location.hash!==`#${stops[index].id}`)window.history.pushState(null,'',`#${stops[index].id}`);
    wake();
  }
  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    const index=stops.findIndex(stop=>`#${stop.id}`===link.getAttribute('href'));
    if(index>=0)link.addEventListener('click',event=>{event.preventDefault();go(index);if(link.classList.contains('skip'))$('#search').focus({preventScroll:true});});
  });
  window.addEventListener('popstate',()=>{const index=stops.findIndex(stop=>`#${stop.id}`===location.hash);go(index<0?0:index,{history:false});});
  function insideDialog(){return Boolean(document.querySelector('dialog[open]'));}
  function scrollingPanel(target,direction){
    for(let element=target instanceof Element?target:null;element&&element!==document.body;element=element.parentElement){
      if(!/(auto|scroll)/.test(getComputedStyle(element).overflowY)||element.scrollHeight<=element.clientHeight+2)continue;
      if(direction>0?element.scrollTop+element.clientHeight<element.scrollHeight-2:element.scrollTop>2)return element;
    }
    return null;
  }
  window.addEventListener('wheel',event=>{
    if(event.ctrlKey||insideDialog(event.target)||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
    const now=performance.now();if(now-lastWheel>220){wheelLatched=false;wheelDelta=0;}lastWheel=now;
    if(scrollingPanel(event.target,event.deltaY)){wheelLatched=true;return;}
    event.preventDefault();if(travel||wheelLatched)return;
    wheelDelta+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    if(Math.abs(wheelDelta)>=10){wheelLatched=true;go(destination+Math.sign(wheelDelta));}
  },{passive:false});
  window.addEventListener('touchstart',event=>{
    if(event.touches.length!==1||insideDialog(event.target)){touch=null;return;}
    const point=event.touches[0];touch={x:point.clientX,y:point.clientY,dy:0,internal:false};
  },{passive:true});
  window.addEventListener('touchmove',event=>{
    if(!touch||event.touches.length!==1)return;
    const point=event.touches[0],dx=touch.x-point.clientX,dy=touch.y-point.clientY;touch.dy=dy;
    if(Math.abs(dx)>Math.abs(dy)||Math.abs(dy)<8)return;
    if(touch.internal||scrollingPanel(event.target,dy)){touch.internal=true;return;}
    event.preventDefault();
  },{passive:false});
  window.addEventListener('touchend',()=>{if(touch&&!touch.internal&&Math.abs(touch.dy)>35&&!travel)go(destination+Math.sign(touch.dy));touch=null;},{passive:true});
  window.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  window.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||insideDialog(event.target)||event.target.closest?.('input,select,textarea,[contenteditable=true]'))return;
    let direction=['ArrowDown','PageDown',' '].includes(event.key)?1:['ArrowUp','PageUp'].includes(event.key)?-1:0;
    if(event.key===' '&&event.shiftKey)direction=-1;
    if(!direction&&!['Home','End'].includes(event.key))return;
    const panel=scrollingPanel(event.target,direction);
    if(panel&&direction){event.preventDefault();panel.scrollBy({top:direction*(event.key.startsWith('Arrow')?60:panel.clientHeight*.8),behavior:paused?'instant':'smooth'});return;}
    if(event.key===' '&&event.target.closest?.('button,a'))return;
    event.preventDefault();if(!travel)go(event.key==='Home'?0:event.key==='End'?stops.length-1:destination+direction);
  });
  window.addEventListener('scroll',()=>{
    if(travel||insideDialog(document.activeElement))return;
    clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
      const index=Math.round(routePosition(scrollY,anchors));
      if(Math.abs(scrollY-anchors[index])>2||Math.abs(route-index)>.001)go(index,{history:false});
    },160);
  },{passive:true});
  new ResizeObserver(()=>{measure();if(travel)travel.to=anchors[destination];wake();}).observe(document.querySelector('main'));
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
    power=!power;screens.forEach((screen,index)=>screen.material=power?(index?litScreen:menuScreen):darkScreen);$('#power-monitor').textContent=power?'Matikan monitor':'Nyalakan monitor';$('#power-monitor').setAttribute('aria-pressed',String(power));
    if(!power)leaveComputer(false);
    feedback('workstation',power?'Monitor aktif. Pilih layanan di layar komputer.':'Monitor dimatikan. Nyalakan untuk membuka layanan kembali.');wake();
  });
  function hidePreview(){preview.hidden=true;previewLink?.removeAttribute('aria-describedby');previewLink=null;}
  function placePreview(){
    if(!previewLink||computer.hidden){hidePreview();return;}
    const rect=previewLink.getBoundingClientRect(),box=preview.getBoundingClientRect();
    preview.style.left=`${clamp(rect.right+12,12,innerWidth-box.width-12)}px`;
    preview.style.top=`${clamp(rect.top-box.height-10,100,innerHeight-box.height-12)}px`;
  }
  computer.querySelectorAll('a').forEach(link=>{
    function showPreview(){
      previewLink?.removeAttribute('aria-describedby');previewLink=link;
      preview.querySelector('strong').textContent=link.querySelector('.service-name').textContent;
      preview.querySelector('span').textContent=link.querySelector('.service-address').textContent;
      link.setAttribute('aria-describedby','service-preview');preview.hidden=false;placePreview();
      $('#lab-hover').hidden=true;marker.visible=false;
    }
    link.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')showPreview();});
    link.addEventListener('pointerleave',()=>{if(document.activeElement!==link)hidePreview();});
    link.addEventListener('focus',showPreview);
    link.addEventListener('blur',hidePreview);
  });
  function leaveComputer(restoreFocus){
    computerTarget=0;delete document.body.dataset.computer;$('#computer-close').hidden=true;
    $('#computer-open').setAttribute('aria-expanded','false');hidePreview();
    if(restoreFocus)$('#computer-open').focus({preventScroll:true});
    wake();
  }
  document.addEventListener('computer-open',()=>{
    if(destination!==3)go(3);
    if(!power)$('#power-monitor').click();
    computerTarget=1;document.body.dataset.computer='entered';$('#computer-close').hidden=false;
    $('#computer-open').setAttribute('aria-expanded','true');$('#computer-close').focus({preventScroll:true});
    $('#lab-hover').hidden=true;marker.visible=false;wake();
  });
  document.addEventListener('computer-close',()=>leaveComputer(true));
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!insideDialog()){if(previewLink)hidePreview();else if(computerTarget)leaveComputer(true);}});
  function rotate(delta){if(computerTarget)leaveComputer(false);const pose=sampleRoute(route);targetYaw=clamp(targetYaw+delta,-.55-pose.yaw,1.05-pose.yaw);wake();}
  function zoomBy(factor){targetZoom=clamp(targetZoom*factor,.85,1.5);wake();}
  $('#rotate-left').addEventListener('click',()=>rotate(-.13));$('#rotate-right').addEventListener('click',()=>rotate(.13));
  $('#zoom-in').addEventListener('click',()=>zoomBy(.9));$('#zoom-out').addEventListener('click',()=>zoomBy(1.1));
  $('#reset-view').addEventListener('click',()=>{targetYaw=0;targetZoom=1;wake();});
  canvas.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();rotate(-.13);}if(event.key==='ArrowRight'){event.preventDefault();rotate(.13);}
    if(event.key==='+'||event.key==='='){event.preventDefault();zoomBy(.9);}if(event.key==='-'){event.preventDefault();zoomBy(1.1);}
  });
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function projectMenu(){
    if(lost)return;
    computer.hidden=selected!==3||Boolean(travel)||!power;
    if(computer.hidden){hidePreview();return;}
    const screen=screens[0],w=viewport.clientWidth,h=viewport.clientHeight;
    const points=[[-.52,.325],[.52,.325],[.52,-.325],[-.52,-.325]].map(([x,y])=>{
      const p=screen.localToWorld(new THREE.Vector3(x,y,.001)).project(camera);
      return {x:(p.x+1)*w/2,y:(1-p.y)*h/2,z:p.z};
    });
    // A projective transform pins native links to all four corners of the physical screen.
    const [p0,p1,p2,p3]=points,dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
    const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y,den=dx1*dy2-dx2*dy1;
    const center=screen.getWorldPosition(new THREE.Vector3()).project(camera);
    raycaster.setFromCamera(new THREE.Vector2(center.x,center.y),camera);
    const front=raycaster.intersectObjects([room,...Object.values(stations)],true)[0]?.object;
    if(Math.abs(den)<.01||points.some(p=>p.z>1||p.z< -1)||front!==screen){computer.hidden=true;hidePreview();return;}
    const g=(dx3*dy2-dx2*dy3)/den,j=(dx1*dy3-dx3*dy1)/den;
    const a=p1.x-p0.x+g*p1.x,b=p3.x-p0.x+j*p3.x,d=p1.y-p0.y+g*p1.y,e=p3.y-p0.y+j*p3.y;
    computer.style.transform=`matrix3d(${a/640},${d/640},0,${g/640},${b/400},${e/400},0,${j/400},0,0,1,0,${p0.x},${p0.y},0,1)`;
    if(previewLink)placePreview();
  }
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
    if(index>=0)tooltip.textContent=key==='workstation'&&selected===3?'Komputer lab · pilih layanan':`${stops[index].label} · klik untuk masuk`;
    canvas.style.cursor=key?'pointer':'grab';
    if(hover!==key){hover=key;marker.visible=index>=0;if(index>=0){const t=stops[index].target;marker.position.set(t[0],.065,t[2]);}wake();}
  });
  canvas.addEventListener('pointerup',event=>{if(drag&&!drag.moved){const key=hit(event),index=stops.findIndex(stop=>stop.key===key);if(key==='workstation'&&destination===3&&!travel)$('#computer-open').click();else if(index>=0)go(index);}drag=null;});
  canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('pointerleave',()=>{hover=null;marker.visible=false;$('#lab-hover').hidden=true;wake();});
  function updateMotion(){
    $('#motion').textContent=paused?'Aktifkan gerakan':'Hentikan gerakan';$('#motion').setAttribute('aria-pressed',String(paused));
    if(paused){if(travel){route=destination;window.scrollTo({top:anchors[destination],behavior:'instant'});travel=null;}if(sending)finishPacket();}wake();
  }
  $('#motion').addEventListener('click',()=>{paused=!paused;updateMotion();});
  media.addEventListener('change',()=>{paused=media.matches;updateMotion();});
  function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=matchMedia('(max-width:760px)').matches?43:44;camera.updateProjectionMatrix();measure();if(travel)travel.to=anchors[destination];else window.scrollTo({top:anchors[destination],behavior:'instant'});wake();}
  new ResizeObserver(resize).observe(viewport);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(sending&&performance.now()-sendStart>2600)finishPacket();wake();}});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();leaveComputer(false);lost=true;$('#lab-loading').hidden=false;$('#lab-loading').textContent='Koneksi grafis terputus. Muat ulang halaman untuk membuka lab kembali.';document.querySelectorAll('.lab-camera button,.lab-actions button:not(#computer-open),#motion').forEach(button=>button.disabled=true);});
  function render(time){
    frame=0;if(document.hidden||lost)return;
    const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
    const blend=paused?1:1-Math.exp(-6*dt);
    if(travel){const t=clamp((time-travel.start)/travel.duration,0,1),eased=smooth(t);route=travel.from+(destination-travel.from)*eased;window.scrollTo({top:travel.y+(travel.to-travel.y)*eased,behavior:'instant'});if(t===1){route=destination;travel=null;}}
    else route=destination;
    yawOffset+=(targetYaw-yawOffset)*blend;zoom+=(targetZoom-zoom)*blend;
    const pose=sampleRoute(route),look=new THREE.Vector3(...pose.target);
    const yaw=clamp(pose.yaw+yawOffset,-.55,1.05),distance=pose.radius*zoom;
    camera.position.set(look.x+Math.sin(yaw)*Math.cos(pose.elevation)*distance,look.y+Math.sin(pose.elevation)*distance,look.z+Math.cos(yaw)*Math.cos(pose.elevation)*distance);
    computerFocus=paused?computerTarget:computerFocus+(computerTarget-computerFocus)*blend;
    if(Math.abs(computerTarget-computerFocus)<.001)computerFocus=computerTarget;
    const screenCenter=screens[0].position;
    const screenHeight=Math.min(viewport.clientWidth*.9*.625,720*.625,viewport.clientHeight-180);
    const screenDistance=.65*viewport.clientHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.max(100,screenHeight));
    camera.position.lerp(new THREE.Vector3(screenCenter.x,screenCenter.y,screenCenter.z+screenDistance),computerFocus);
    look.lerp(screenCenter,computerFocus);camera.lookAt(look);
    const goal=exploded?1:0;explosion=paused?goal:explosion+(goal-explosion)*blend;
    parts.forEach((part,index)=>{part.position.copy(partOrigins[index]);part.position.y+=explosion*[.13,.22,.8,.5][index];});
    if(selection.visible){selection.update();if(time>highlightUntil)selection.visible=false;}
    if(sending){const t=clamp((time-sendStart)/2600,0,1);packet.visible=true;packet.position.copy(path.curve.getPointAt(t));if(t>=1)finishPacket();}
    const atRepository=destination===4&&!travel&&Math.abs(route-4)<.001;
    let drawersMoving=false;
    for(const drawer of drawers){
      const target=atRepository&&(repositoryCategory==='Semua'||repositoryCategory===drawer.category)?1:0;
      if(target!==drawer.target){drawer.from=drawer.progress;drawer.target=target;drawer.start=time;drawer.duration=target?450:320;}
      const t=paused?1:clamp((time-drawer.start)/drawer.duration,0,1);
      drawer.progress=drawer.from+(drawer.target-drawer.from)*smooth(t);
      drawer.group.position.z=drawer.closedZ+drawer.progress*.72;
      if(drawer.progress!==drawer.target)drawersMoving=true;
    }
    updateChapter(Math.round(route));$('#route-progress').style.width=`${route/(stops.length-1)*100}%`;
    renderer.render(scene,camera);
    projectMenu();
    canvas.dataset.route=route.toFixed(4);canvas.dataset.camera=camera.position.toArray().map(n=>n.toFixed(3)).join(',');canvas.dataset.station=stops[selected].key;
    canvas.dataset.drawers=JSON.stringify(Object.fromEntries(drawers.map(drawer=>[drawer.category,Number(drawer.progress.toFixed(4))])));
    if(travel||drawersMoving||computerFocus!==computerTarget||Math.abs(yawOffset-targetYaw)>.0001||Math.abs(zoom-targetZoom)>.0001||Math.abs(explosion-goal)>.001||sending||selection.visible)wake();
  }
  updateMotion();resize();updateChapter(selected);$('#lab-loading').hidden=true;canvas.dataset.ready='true';
  // Align direct anchor visits after layout so each chapter starts at its exact stop.
  const initial=stops.findIndex(stop=>`#${stop.id}`===location.hash);
  const align=()=>requestAnimationFrame(()=>{measure();const index=initial>=0?initial:Math.round(routePosition(scrollY,anchors));travel=null;route=destination=index;window.scrollTo({top:anchors[index],behavior:'instant'});wake();});
  if(document.readyState==='complete')align();else window.addEventListener('load',align,{once:true});
}
