(() => {
const canvas=document.getElementById('game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor(0x9dc8d4);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x9dc8d4); scene.fog=new THREE.Fog(0x9dc8d4,48,125);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,220);
scene.add(new THREE.HemisphereLight(0xdaf4ff,0x45533a,2.1));
const sun=new THREE.DirectionalLight(0xffedc4,2.3);sun.position.set(-30,55,25);sun.castShadow=true;scene.add(sun);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
const groundMat=mat(0x47794a), sandMat=mat(0xc7b27d), trunkMat=mat(0x62452e), leafMat=mat(0x286345), wallMat=mat(0x8d9997), roofMat=mat(0x59636b);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(180,45,0x365e3b,0x426c45);grid.position.y=.02;scene.add(grid);
// Shoreline, paths, buildings and cover
function box(x,y,z,sx,sy,sz,material,collide=true){let m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);if(collide)obstacles.push({x,z,hx:sx/2,hz:sz/2});return m}
const obstacles=[];
box(0,-.08,0,180,.2,180,groundMat,false);
for(let i=0;i<10;i++){let a=i*Math.PI/5;let r=76;let t=new THREE.Mesh(new THREE.CylinderGeometry(8,10,1,24),sandMat);t.position.set(Math.cos(a)*r,-.05,Math.sin(a)*r);t.rotation.x=0;scene.add(t)}
// buildings
for(const b of [[-15,-12,10,8],[15,-22,12,9],[28,10,10,10],[-29,19,12,9],[3,28,11,8],[-39,-10,8,8],[39,-27,10,7],[0,-42,12,9]]){
 let [x,z,w,d]=b;box(x,1.5,z,w,3,d,wallMat);box(x,3.1,z,w+.5,.25,d+.5,roofMat,false);
 // door dark opening decoration
 box(x,0.75,z+d/2+.02,1.5,1.5,.08,mat(0x273238),false);
}
// trees
function tree(x,z){let tr=new THREE.Mesh(new THREE.CylinderGeometry(.25,.45,2.7,7),trunkMat);tr.position.set(x,1.35,z);tr.castShadow=true;scene.add(tr);let crown=new THREE.Mesh(new THREE.ConeGeometry(1.8,4.2,7),leafMat);crown.position.set(x,4,z);crown.castShadow=true;scene.add(crown)}
for(let i=0;i<65;i++){let x=(Math.random()-.5)*145,z=(Math.random()-.5)*145;if(Math.hypot(x,z)<12)continue; if(obstacles.some(o=>Math.abs(x-o.x)<o.hx+2&&Math.abs(z-o.z)<o.hz+2))continue;tree(x,z)}
// little rocks
for(let i=0;i<30;i++){let rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.5+Math.random()),mat(0x777d73));rock.position.set((Math.random()-.5)*130,.35,(Math.random()-.5)*130);rock.scale.y=.6;scene.add(rock)}
const player={x:0,z:5,yaw:0,pitch:0,hp:100,weapon:'PISTOL',mag:12,ammo:48,kills:0};
const playerGroup=new THREE.Group();scene.add(playerGroup);
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,.8,4,8),mat(0x2877c7));body.position.y=1;body.castShadow=true;playerGroup.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),mat(0xd6a47d));head.position.y=1.75;playerGroup.add(head);
const gun=new THREE.Mesh(new THREE.BoxGeometry(.18,.16,.8),mat(0x252a2d));gun.position.set(.35,1.3,-.48);playerGroup.add(gun);
const bots=[], loot=[];
const gunTypes=[{name:'PISTOL',damage:24,rate:380,mag:12,ammo:48,color:0xe5e5e5},{name:'RIFLE',damage:17,rate:130,mag:30,ammo:120,color:0xdba23d},{name:'SHOTGUN',damage:12,rate:650,mag:6,ammo:36,color:0x54d6be}];
let weapon=gunTypes[0],started=false,ended=false,remaining=600,lastShot=0,lastTime=performance.now(),noticeTimer=0,zoneRadius=75,zoneTick=0;
const rand=(a,b)=>a+Math.random()*(b-a);
function addLoot(x,z,type){const w=type||gunTypes[1+Math.floor(Math.random()*2)];const g=new THREE.Group();let base=new THREE.Mesh(new THREE.BoxGeometry(.45,.16,.8),mat(w.color));base.rotation.y=rand(0,Math.PI);base.position.y=.32;g.add(base);let glow=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.04,12),mat(0xffc247));glow.position.y=.06;g.add(glow);g.position.set(x,0,z);scene.add(g);loot.push({x,z,w,group:g})}
function spawnBot(i){let x,z;do{x=rand(-58,58);z=rand(-58,58)}while(Math.hypot(x,z)<18||obstacles.some(o=>Math.abs(x-o.x)<o.hx+2&&Math.abs(z-o.z)<o.hz+2));let group=new THREE.Group();let bm=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.78,3,7),mat([0xb7463e,0x6d4da6,0x3c8a68,0xb18a3c][i%4]));bm.position.y=.95;bm.castShadow=true;group.add(bm);let h=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),mat(0xc99573));h.position.y=1.65;group.add(h);scene.add(group);bots.push({x,z,hp:100,group,alive:true,shoot:rand(1,4),wander:rand(0,6),dir:rand(0,6.28)})}
for(let i=0;i<12;i++)spawnBot(i);
for(let i=0;i<24;i++){let x=rand(-65,65),z=rand(-65,65);if(Math.hypot(x,z)>12)addLoot(x,z)}
function showNotice(t){document.getElementById('notice').textContent=t;noticeTimer=2}
function equip(w){weapon=w;player.weapon=w.name;player.mag=w.mag;player.ammo=w.ammo;showNotice('PICKED UP '+w.name+'!')}
function nearestLoot(){let best=null,dist=4;for(const l of loot){let d=Math.hypot(l.x-player.x,l.z-player.z);if(d<dist){best=l;dist=d}}return best}
function pickup(){let l=nearestLoot();if(!l){showNotice('NO WEAPON NEARBY');return}equip(l.w);scene.remove(l.group);loot.splice(loot.indexOf(l),1)}
function reload(){if(player.mag===weapon.mag||player.ammo<=0)return;let n=Math.min(weapon.mag-player.mag,player.ammo);player.mag+=n;player.ammo-=n;ui()}
function ui(){document.getElementById('healthBar').style.width=Math.max(0,player.hp)+'%';document.getElementById('healthNum').textContent=Math.max(0,Math.ceil(player.hp));document.getElementById('weaponName').textContent=weapon.name;document.getElementById('ammo').textContent=player.mag+' / '+player.ammo;document.getElementById('kills').textContent=player.kills;document.getElementById('alive').textContent='LEGENDS: '+(1+bots.filter(b=>b.alive).length);document.getElementById('timer').textContent=Math.floor(remaining/60).toString().padStart(2,'0')+':'+Math.floor(remaining%60).toString().padStart(2,'0')}
function end(win){if(ended)return;ended=true;document.exitPointerLock?.();document.getElementById('endTitle').textContent=win?'VICTORY!':'ELIMINATED';document.getElementById('endText').textContent=win?'You survived the 10-minute match and eliminated '+player.kills+' opponents.':'You eliminated '+player.kills+' opponents. Drop back in and try again.';document.getElementById('endScreen').classList.remove('hidden')}
function damagePlayer(n){player.hp-=n;ui();if(player.hp<=0)end(false)}
function shoot(){if(!started||ended)return;let now=performance.now();if(now-lastShot<weapon.rate)return;lastShot=now;if(player.mag<=0){showNotice('OUT OF AMMO — PRESS R');return}player.mag--;ui();
 // raycast from camera through crosshair, hit bots
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);
 let targets=bots.filter(b=>b.alive).map(b=>b.group.children[0]);let hits=ray.intersectObjects(targets,false);
 if(hits.length){let obj=hits[0].object;let b=bots.find(v=>v.group.children[0]===obj);if(b){b.hp-=weapon.damage;if(b.hp<=0){b.alive=false;scene.remove(b.group);player.kills++;addLoot(b.x,b.z,Math.random()<.65?gunTypes[1]:gunTypes[2]);showNotice('ELIMINATION + LOOT');if(bots.every(v=>!v.alive))end(true)}else showNotice('HIT!')}}
}
const keys={};let mouseDown=false;
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')pickup();if(e.code==='KeyR')reload();if(e.code==='Space')e.preventDefault()});
addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('click',()=>{if(!started||ended)return;if(matchMedia('(pointer:fine)').matches){canvas.requestPointerLock?.()}shoot()});
addEventListener('mousedown',e=>{if(e.button===0&&started)mouseDown=true});addEventListener('mouseup',()=>mouseDown=false);
addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas){player.yaw-=e.movementX*.0025;player.pitch=Math.max(-.55,Math.min(.55,player.pitch-e.movementY*.002))}});
let joy={x:0,y:0};const joyEl=document.getElementById('joystick'),stick=document.getElementById('stick');let joyActive=false;
function joyMove(e){let r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=35,d=Math.hypot(dx,dy);if(d>max){dx=dx/d*max;dy=dy/d*max}joy.x=dx/max;joy.y=dy/max;stick.style.left=(33+dx)+'px';stick.style.top=(33+dy)+'px'}
joyEl.addEventListener('pointerdown',e=>{joyActive=true;joyEl.setPointerCapture(e.pointerId);joyMove(e)});joyEl.addEventListener('pointermove',e=>{if(joyActive)joyMove(e)});function joyEnd(){joyActive=false;joy.x=joy.y=0;stick.style.left='33px';stick.style.top='33px'}joyEl.addEventListener('pointerup',joyEnd);joyEl.addEventListener('pointercancel',joyEnd);
let aimPointer=null,lastTouchX=0,lastTouchY=0;
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX>innerWidth*.42){aimPointer=e.pointerId;lastTouchX=e.clientX;lastTouchY=e.clientY;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointermove',e=>{if(e.pointerId===aimPointer){player.yaw-=(e.clientX-lastTouchX)*.006;player.pitch=Math.max(-.5,Math.min(.5,player.pitch-(e.clientY-lastTouchY)*.004));lastTouchX=e.clientX;lastTouchY=e.clientY}});
canvas.addEventListener('pointerup',e=>{if(e.pointerId===aimPointer)aimPointer=null});
document.getElementById('fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();shoot()});document.getElementById('pickupBtn').addEventListener('click',pickup);document.getElementById('reloadBtn').addEventListener('click',reload);
function moveEntity(ent,dx,dz){let nx=ent.x+dx,nz=ent.z+dz;let blocked=obstacles.some(o=>Math.abs(nx-o.x)<o.hx+.55&&Math.abs(nz-o.z)<o.hz+.55);if(!blocked){ent.x=nx;ent.z=nz}ent.x=Math.max(-82,Math.min(82,ent.x));ent.z=Math.max(-82,Math.min(82,ent.z))}
function update(dt){if(!started||ended)return;remaining-=dt;if(remaining<=0){remaining=0;end(true)}zoneTick+=dt;if(zoneTick>18){zoneTick=0;zoneRadius=Math.max(18,zoneRadius-3);showNotice('SAFE ZONE SHRINKING!')}if(Math.hypot(player.x,player.z)>zoneRadius){damagePlayer(5*dt)}
let forward=(keys.KeyW?1:0)-(keys.KeyS?1:0)-joy.y,side=(keys.KeyD?1:0)-(keys.KeyA?1:0)+joy.x;let speed=(keys.ShiftLeft?9:6)*dt;let fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=Math.cos(player.yaw),rz=-Math.sin(player.yaw);let dx=(fx*forward+rx*side)*speed,dz=(fz*forward+rz*side)*speed;moveEntity(player,dx,dz);playerGroup.position.set(player.x,0,player.z);playerGroup.rotation.y=player.yaw;
if(mouseDown)shoot();
for(const b of bots){if(!b.alive)continue;let d=Math.hypot(player.x-b.x,player.z-b.z);b.wander-=dt;if(d<28){b.dir=Math.atan2(player.x-b.x,player.z-b.z);if(d>8){moveEntity(b,Math.sin(b.dir)*dt*2.1,Math.cos(b.dir)*dt*2.1)}b.shoot-=dt;if(b.shoot<=0&&d<24){b.shoot=rand(1.2,2.6);if(Math.random()<.38)damagePlayer(rand(5,10))}}else if(b.wander<=0){b.wander=rand(2,5);b.dir=rand(0,6.28)}else{moveEntity(b,Math.sin(b.dir)*dt*.8,Math.cos(b.dir)*dt*.8)}b.group.position.set(b.x,0,b.z);b.group.rotation.y=b.dir}
let target=new THREE.Vector3(player.x,1.25,player.z);let camDist=8;camera.position.set(player.x+Math.sin(player.yaw)*camDist,4.3+player.pitch*3,player.z+Math.cos(player.yaw)*camDist);camera.lookAt(target);
let l=nearestLoot();document.getElementById('pickupPrompt').style.display=l?'block':'none';if(l)document.getElementById('pickupPrompt').textContent=(matchMedia('(pointer:coarse)').matches?'TAP PICK UP':'E / PICK UP')+' · '+l.w.name;
if(noticeTimer>0){noticeTimer-=dt;if(noticeTimer<=0)document.getElementById('notice').textContent=''}
ui()}
function animate(now){requestAnimationFrame(animate);let dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;update(dt);renderer.render(scene,camera)}
function reset(){location.reload()}
document.getElementById('startBtn').addEventListener('click',()=>{started=true;document.getElementById('startScreen').classList.add('hidden');if(matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.();showNotice('FIND A WEAPON AND SURVIVE!');lastTime=performance.now()});
document.getElementById('againBtn').addEventListener('click',reset);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
ui();animate(performance.now());
})();