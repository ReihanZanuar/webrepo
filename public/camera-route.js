export const stops = [
  {key:'overview',id:'beranda',label:'01 / Selamat datang',target:[0,1,0],radius:19.2,yaw:.58,elevation:.60},
  {key:'assembly',id:'jelajah',label:'02 / Meja perakitan',target:[-2.15,1.55,1.45],radius:6.1,yaw:.50,elevation:.69},
  {key:'network',id:'jaringan',label:'03 / Rak jaringan',target:[2.85,1.48,-2.45],radius:6.1,yaw:.38,elevation:.36},
  {key:'workstation',id:'workstation',label:'04 / Workstation',target:[-1.65,1.65,-2.5],radius:7,yaw:.12,elevation:.34},
  {key:'repository',id:'repository',label:'05 / Repository',target:[3.6,1.15,1.25],radius:8.2,yaw:.42,elevation:.50},
  {key:'closing',id:'penutup',label:'06 / Sampai jumpa',target:[0,1,0],radius:19.5,yaw:.22,elevation:.68}
];
export const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
export const smooth = value => {const t=clamp(value,0,1);return t*t*t*(t*(t*6-15)+10);};
export function sampleRoute(progress) {
  const p=clamp(progress,0,stops.length-1),index=Math.min(Math.floor(p),stops.length-2);
  // A short dwell lets readers inspect each station; intermediate poses share exact endpoints.
  const t=smooth(clamp((p-index-.12)/.76,0,1)),a=stops[index],b=stops[index+1];
  const mix=(x,y)=>x+(y-x)*t;
  return {target:a.target.map((v,i)=>mix(v,b.target[i])),radius:mix(a.radius,b.radius)+Math.sin(Math.PI*t)*1.1,yaw:mix(a.yaw,b.yaw),elevation:mix(a.elevation,b.elevation)};
}
export function routePosition(scrollY,anchors) {
  if(scrollY<=anchors[0])return 0;
  for(let i=0;i<anchors.length-1;i++)if(scrollY<anchors[i+1])return i+clamp((scrollY-anchors[i])/Math.max(1,anchors[i+1]-anchors[i]),0,1);
  return anchors.length-1;
}
