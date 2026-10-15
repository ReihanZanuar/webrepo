import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleRoute,routePosition,stops} from './public/camera-route.js';

test('route reaches every station and remains continuous at segment seams',()=>{
 for(let i=0;i<stops.length;i++){
  const pose=sampleRoute(i);assert.deepEqual(pose.target,stops[i].target);assert.equal(pose.radius,stops[i].radius);
  if(i>0&&i<stops.length-1){const before=sampleRoute(i-.00001),after=sampleRoute(i+.00001);for(const field of ['radius','yaw','elevation'])assert.ok(Math.abs(before[field]-after[field])<.0001);}
 }
 let prior=sampleRoute(0);
 for(let p=.001;p<=5;p+=.001){const pose=sampleRoute(p);assert.ok(pose.radius>=6);assert.ok(pose.elevation>=.3&&pose.elevation<=.7);assert.ok(Math.abs(pose.radius-prior.radius)<.1);assert.ok(Math.max(...pose.target.map((v,i)=>Math.abs(v-prior.target[i])))<.1);prior=pose;}
});
test('scroll mapping supports unequal section heights, reverse scroll and edge clamping',()=>{
 const anchors=[0,1000,2400,3400,5000,7000];
 assert.equal(routePosition(-50,anchors),0);assert.equal(routePosition(1700,anchors),1.5);assert.equal(routePosition(5000,anchors),4);assert.equal(routePosition(9999,anchors),5);assert.equal(routePosition(1000,anchors),1);
});
