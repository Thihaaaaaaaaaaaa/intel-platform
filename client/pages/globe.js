// ═══════════════════════════════════════════════════════════════
// GLOBE v4.0 — Photo-realistic Earth + Full Satellite Intelligence
//
// TEXTURES (all loaded from /assets/):
//   earth_albedo.jpg          — high-res dayside colour map (8K)
//   earth_bump.jpg            — elevation bump map (8K)
//   earth_land_ocean_mask.png — specular mask (ocean=reflective)
//   earth_night_lights_modified.png — city lights for dark side
//   clouds_earth.png          — cloud alpha map (slowly rotating)
//
// SATELLITE TOOLTIPS: hover → full intel card (name, nation, type,
//   orbit, purpose, description, capabilities, threat level)
// ═══════════════════════════════════════════════════════════════
(function () {
'use strict';

// ── State ──────────────────────────────────────────────────────
let scene, camera, renderer, globeGroup, earthMesh, cloudMesh, nightMesh;
let isDragging = false, prevMouse = {x:0,y:0};
let rotVelX = 0, rotVelY = 0.00035;
let pinnedTarget = null;
let hoveredSat = null;
let simTime = Date.now() / 1000;

let flightObjs     = [];
let weatherObjs    = [];
let disasterObjs   = [];
let satObjs        = {};
let shipObjs       = [];
let conflictObjs   = [];
let cyberBeams     = [];
let routeLines     = [];
let particleSystems= [];
let lightningTimer = 0;

const L = {
  flights:true, sats:true, ships:true, conflicts:true,
  cyber:true, routes:false, cables:true, currents:true,
  clouds:true, wildfires:true, heatmap:true, nightlights:true,
  weather:true, disasters:true,
};

// Globe constants — match OBJ model scale (radius = 100)
const R       = 100;
const R_ATM   = 106.5;
const R_GLOW  = 114;
const R_CLOUD = 102.8;
const R_NIGHT = 100.15;  // night lights just above surface
const R_FLT   = 104;
const R_SHIP  = 101.2;
const R_SAT   = { STAR:110, LEO:124, SPY:118, MEO:158, GEO:204, DEBRIS:130 };

// ─────────────────────────────────────────────────────────────
// COORDINATE HELPERS — matches OBJ model system
// x = R·cos(lat)·cos(lon), y = R·sin(lat), z = R·cos(lat)·sin(lon)
// ─────────────────────────────────────────────────────────────
function ll2v(lat, lon, r) {
  // OBJ model coordinate system (confirmed from UV analysis):
  // x =  R·cos(lat)·cos(lon)
  // y =  R·sin(lat)
  // z = -R·cos(lat)·sin(lon)  ← negative! lon increases along -Z axis
  const la = lat*Math.PI/180, lo = lon*Math.PI/180;
  return new THREE.Vector3(
    r*Math.cos(la)*Math.cos(lo),
    r*Math.sin(la),
   -r*Math.cos(la)*Math.sin(lo)
  );
}

function bearing(la1,lo1,la2,lo2) {
  const R=Math.PI/180, dL=(lo2-lo1)*R;
  const y=Math.sin(dL)*Math.cos(la2*R);
  const x=Math.cos(la1*R)*Math.sin(la2*R)-Math.sin(la1*R)*Math.cos(la2*R)*Math.cos(dL);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}

function lerpLL(oLa,oLo,dLa,dLo,t){return{lat:oLa+(dLa-oLa)*t,lon:oLo+(dLo-oLo)*t};}

// Place mesh on sphere: local +Z = nose toward destination
function placeOnSphere(mesh, lat, lon, brg, r) {
  const pos = ll2v(lat, lon, r);
  mesh.position.copy(pos);
  const normal = pos.clone().normalize();
  const worldY = new THREE.Vector3(0,1,0);
  const northTgt = worldY.clone().sub(normal.clone().multiplyScalar(worldY.dot(normal))).normalize();
  const eastTgt  = new THREE.Vector3().crossVectors(normal,northTgt).normalize();
  const brgRad   = brg*Math.PI/180;
  const forward  = new THREE.Vector3()
    .addScaledVector(northTgt,Math.cos(brgRad))
    .addScaledVector(eastTgt, Math.sin(brgRad)).normalize();
  const right = new THREE.Vector3().crossVectors(forward,normal).normalize();
  mesh.setRotationFromMatrix(new THREE.Matrix4().makeBasis(right,normal,forward));
}

// ─────────────────────────────────────────────────────────────
// TEXTURE LOADER — load all real textures from /assets/
// ─────────────────────────────────────────────────────────────
const texLoader = new THREE.TextureLoader();
function setHUD(html) { const e = document.getElementById('g-tl'); if (e) e.innerHTML = html; }

function loadTex(path, onLoad) {
  texLoader.load(
    path,
    tex => { tex.anisotropy = 8; onLoad(tex); },
    undefined,
    err => { console.warn('[Globe] Texture failed:', path, err); }
  );
}

// ─────────────────────────────────────────────────────────────
// SCENE INIT
// ─────────────────────────────────────────────────────────────
function initScene() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020509);

  const W = canvas.clientWidth||900, H = canvas.clientHeight||600;
  camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 8000);
  camera.position.z = 285;

  renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  buildStarfield();
  buildAtmosphere();
  buildEarth();      // loads photo-realistic textures
  buildNightLights();
  buildCloudLayer();
  buildOceanCurrents();
  buildSubmarineCables();
  buildWildfireMarkers();
  buildWeatherMarkers();
  buildDisasterMarkers();
  buildLights();
  buildControls(canvas);

  animate();
}

// ─────────────────────────────────────────────────────────────
// STARFIELD
// ─────────────────────────────────────────────────────────────
function buildStarfield() {
  const geo = new THREE.BufferGeometry();
  const pos = [], col = [];
  for (let i=0; i<8000; i++) {
    const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
    const r=700+Math.random()*500;
    pos.push(r*Math.sin(ph)*Math.cos(th), r*Math.cos(ph), r*Math.sin(ph)*Math.sin(th));
    const t=Math.random();
    col.push(t<0.05?0.5:0.85+Math.random()*0.15,
             t<0.05?0.5:0.85+Math.random()*0.15,
             t<0.05?(t<0.025?0.5:1):0.9+Math.random()*0.1);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col,3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({vertexColors:true, size:0.9, sizeAttenuation:true})));
}

// ─────────────────────────────────────────────────────────────
// PHOTO-REALISTIC EARTH — OBJ model + real textures
// ─────────────────────────────────────────────────────────────
function buildEarth() {
  // Fallback sphere while OBJ loads
  earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 32),
    new THREE.MeshPhongMaterial({ color: 0x0a1a35, shininess: 5 })
  );
  earthMesh.name = 'earthFallback';
  globeGroup.add(earthMesh);
  setHUD('LOADING GLOBE<br>0%');
  loadGlobeOBJ();
}

function loadGlobeOBJ() {
  // Build the shared earth material ONCE — all textures load into it
  const earthMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x0a1e3c),
    specular: new THREE.Color(0.35, 0.40, 0.55),
    shininess: 18,
  });

  // Load all textures into earthMat immediately (async, will update when ready)
  loadTex('/assets/earth_albedo.jpg', tex => {
    earthMat.map = tex;
    earthMat.needsUpdate = true;
    console.log('[Globe] ✅ Albedo loaded');
  });
  loadTex('/assets/earth_bump.jpg', tex => {
    earthMat.bumpMap = tex;
    earthMat.bumpScale = 0.55;
    earthMat.needsUpdate = true;
    console.log('[Globe] ✅ Bump map loaded');
  });
  loadTex('/assets/earth_land_ocean_mask.png', tex => {
    earthMat.specularMap = tex;
    earthMat.shininess = 50;
    earthMat.needsUpdate = true;
    console.log('[Globe] ✅ Specular mask loaded');
  });

  function onLoad(obj) {
    // Remove fallback sphere
    const ef = globeGroup.getObjectByName('earthFallback');
    if (ef) globeGroup.remove(ef);

    // Walk every mesh in the OBJ
    // OBJ has three named objects: "Globe" (ocean surface), "Land", "Grid"
    // OBJLoader r128 sets child.name from the "o" or "g" directive
    obj.traverse(child => {
      if (!child.isMesh) return;

      // Get name from mesh or parent group
      const raw  = child.name || child.parent?.name || '';
      const n    = raw.toLowerCase();
      console.log('[Globe] mesh:', JSON.stringify(raw), '-> n:', n);

      if (n === 'globe' || n === '' || n === 'object') {
        // Ocean / main surface — apply photo-real texture
        child.material = earthMat;

      } else if (n === 'land') {
        // Land mesh sits on top of ocean — hide it since albedo covers land already
        child.material = new THREE.MeshPhongMaterial({
          color: 0x1a5c1a,
          transparent: true,
          opacity: 0,         // fully hidden once albedo loads
          depthWrite: false,
        });

      } else if (n === 'grid') {
        child.material = new THREE.MeshPhongMaterial({
          color: 0x0d4060,
          transparent: true,
          opacity: 0.22,
        });
        child.userData.isGrid = true;
      }
    });

    globeGroup.add(obj);
    obj.name = 'globeModel';
    setHUD('GLOBE ONLINE<br>V4.0');
    console.log('[Globe] ✅ OBJ model ready');

    // Initialise all overlay layers
    addFlights();
    addSatellites();
    addShips();
    addConflicts();
    addCyberBeams();
    buildHeatmapRings();
  }

  function onProgress(xhr) {
    if (xhr.total) setHUD(`LOADING<br>${Math.round(xhr.loaded / xhr.total * 100)}%`);
  }

  function onError(err) {
    console.warn('[Globe] OBJ load failed:', err?.message || err);
    // Apply textures to fallback sphere instead
    const fb = globeGroup.getObjectByName('earthFallback');
    if (fb) {
      fb.material = earthMat;
      setHUD('GLOBE (FALLBACK)<br>TEXTURES OK');
    }
    addFlights(); addSatellites(); addShips();
    addConflicts(); addCyberBeams(); buildHeatmapRings();
  }

  // Load OBJLoader if not already present, then load the model
  function doLoad() {
    if (typeof THREE.OBJLoader !== 'undefined') {
      const loader = new THREE.OBJLoader();
      loader.load('/assets/Globe.obj', onLoad, onProgress, onError);
    } else {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js';
      s.onload  = doLoad;
      s.onerror = onError;
      document.head.appendChild(s);
    }
  }
  doLoad();
}

// ─────────────────────────────────────────────────────────────
// NIGHT SIDE CITY LIGHTS — shown on globe's dark side
// ─────────────────────────────────────────────────────────────
function buildNightLights() {
  const geo = new THREE.SphereGeometry(R_NIGHT, 128, 64);
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  nightMesh = new THREE.Mesh(geo, mat);
  nightMesh.visible = L.nightlights;
  globeGroup.add(nightMesh);

  loadTex('/assets/earth_night_lights_modified.png', tex => {
    nightMesh.material.map = tex;
    nightMesh.material.opacity = 0.85;
    nightMesh.material.needsUpdate = true;
    console.log('[Globe] ✅ Night lights loaded');
  });
}

// ─────────────────────────────────────────────────────────────
// CLOUD LAYER — real cloud alpha mask, slowly rotating
// ─────────────────────────────────────────────────────────────
function buildCloudLayer() {
  const geo = new THREE.SphereGeometry(R_CLOUD, 128, 64);
  const mat = new THREE.MeshPhongMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });

  cloudMesh = new THREE.Mesh(geo, mat);
  cloudMesh.visible = L.clouds;
  globeGroup.add(cloudMesh);

  loadTex('/assets/clouds_earth.png', tex => {
    // Use cloud texture as both the colour (white) and alpha
    // Black = no cloud, white = cloud
    cloudMesh.material.map = tex;
    cloudMesh.material.alphaMap = tex;
    cloudMesh.material.opacity = 0.88;
    cloudMesh.material.color = new THREE.Color(1.0, 1.0, 1.0);
    cloudMesh.material.needsUpdate = true;
    setHUD('GLOBE ONLINE<br>TEXTURES LOADED');
    console.log('[Globe] ✅ Clouds loaded');
  });
}

// ─────────────────────────────────────────────────────────────
// ATMOSPHERE
// ─────────────────────────────────────────────────────────────
function buildAtmosphere() {
  // Inner blue haze
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(R_ATM, 48, 48),
    new THREE.MeshPhongMaterial({
      color: 0x0066cc, transparent:true, opacity:0.06, side:THREE.FrontSide
    })
  ));
  // Outer glow rim
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(R_GLOW, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x001188, transparent:true, opacity:0.035, side:THREE.BackSide
    })
  ));
}

// ─────────────────────────────────────────────────────────────
// OCEAN CURRENT PARTICLES
// ─────────────────────────────────────────────────────────────
function buildOceanCurrents() {
  const CURRENTS = [
    ['Gulf Stream',      [[7,-55],[15,-60],[25,-75],[35,-75],[45,-60],[50,-30],[55,-20],[60,0]],   0x0099ff],
    ['Kuroshio',         [[20,125],[30,135],[40,145],[45,155],[45,170]],                           0x00aaff],
    ['Antarctic Circ.',  [[-55,-60],[-55,0],[-55,60],[-55,120],[-55,180],[-55,-120]],             0x0066cc],
    ['N.Equatorial',     [[10,160],[10,120],[10,80],[10,40],[10,0],[10,-40],[10,-80]],             0x0077aa],
    ['Agulhas',          [[-25,45],[-30,35],[-35,25],[-40,15],[-38,0]],                           0x3388ff],
    ['Labrador',         [[65,-55],[55,-50],[45,-45],[40,-40]],                                    0x0044aa],
  ];

  CURRENTS.forEach(([name, wpts, color]) => {
    const N = 50;
    const positions = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color, size:0.55, transparent:true, opacity:0.50,
      blending:THREE.AdditiveBlending, depthWrite:false
    }));
    pts.userData.isCurrent = true;
    pts.visible = L.currents;
    globeGroup.add(pts);

    const offsets = Array.from({length:N}, (_,i) => i/N);
    particleSystems.push({pts, wpts, offsets, speed:0.00008+Math.random()*0.00004});
  });
}

function lerp3WPts(wpts, t) {
  const total = wpts.length-1;
  const s = t*total, i = Math.min(Math.floor(s),total-1), f = s-i;
  const a=wpts[i], b=wpts[Math.min(i+1,total)];
  return {lat:a[0]+(b[0]-a[0])*f, lon:a[1]+(b[1]-a[1])*f};
}

// ─────────────────────────────────────────────────────────────
// SUBMARINE CABLES
// ─────────────────────────────────────────────────────────────
function buildSubmarineCables() {
  const CABLES = [
    [[50,-1],[34,32],[22,38],[12,44],[1,103]],
    [[51,1],[37,15],[24,56],[1,104],[22,113]],
    [[40,-73],[42,-60],[48,-30],[50,-5],[51,2]],
    [[37,-122],[22,-157],[21,157],[35,135]],
    [[39,-77],[48,-30],[43,-9],[43,-8]],
    [[34,-118],[22,114],[-18,122],[-34,151]],
    [[51,0],[22,14],[-26,32],[-34,18]],
  ];
  const mat = new THREE.LineBasicMaterial({
    color:0x00aaff, transparent:true, opacity:0.22,
    blending:THREE.AdditiveBlending, depthWrite:false
  });
  CABLES.forEach(waypoints => {
    const pts = [];
    for (let i=0; i<waypoints.length-1; i++) {
      const [la1,lo1]=waypoints[i], [la2,lo2]=waypoints[i+1];
      for (let t=0; t<=1; t+=0.03) pts.push(ll2v(la1+(la2-la1)*t, lo1+(lo2-lo1)*t, R-0.4));
    }
    if (pts.length<2) return;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat.clone());
    line.userData.isCable = true;
    line.visible = L.cables;
    globeGroup.add(line);
  });
}

// ─────────────────────────────────────────────────────────────
// WILDFIRE MARKERS
// ─────────────────────────────────────────────────────────────
function buildWildfireMarkers() {
  const FIRES = APP.wildfires && APP.wildfires.length > 0 ? APP.wildfires : [
    {lat:-5,  lon:-60,  name:'Amazon',    intensity:0.9},
    {lat:62,  lon:120,  name:'Siberia',   intensity:0.7},
    {lat:58,  lon:-115, name:'Canada',    intensity:0.8},
    {lat:-25, lon:135,  name:'Australia', intensity:0.6},
    {lat:0,   lon:24,   name:'Congo',     intensity:0.5},
    {lat:38,  lon:-120, name:'California',intensity:0.7},
  ];
  const old=[]; globeGroup.traverse(c=>{if(c.userData.isFire) old.push(c);}); old.forEach(c=>globeGroup.remove(c));
  FIRES.forEach(fire => {
    const g = new THREE.Mesh(new THREE.SphereGeometry(1.6*fire.intensity,8,8),
      new THREE.MeshBasicMaterial({color:0xff4400, transparent:true, opacity:fire.intensity*0.45,
        blending:THREE.AdditiveBlending, depthWrite:false}));
    g.position.copy(ll2v(fire.lat, fire.lon, R+0.6));
    g.visible = L.wildfires; g.userData.isFire=true;
    g.userData.baseOpacity=fire.intensity*0.45; g.userData.phase=Math.random()*Math.PI*2;
    globeGroup.add(g);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.0,3.2,12),
      new THREE.MeshBasicMaterial({color:0xff6600, transparent:true, opacity:0.22,
        side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false}));
    ring.position.copy(ll2v(fire.lat,fire.lon,R+1));
    ring.lookAt(0,0,0); ring.rotateX(Math.PI/2);
    ring.visible=L.wildfires; ring.userData.isFire=true;
    globeGroup.add(ring);
  });
}

// ─────────────────────────────────────────────────────────────
// LIGHTS
// ─────────────────────────────────────────────────────────────
function buildLights() {
  scene.add(new THREE.AmbientLight(0x223355, 0.5)); // low ambient — let sun dominate
  const sun = new THREE.DirectionalLight(0xfff5ee, 2.4);
  sun.position.set(280, 80, 180);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x0011aa, 0.25);
  rim.position.set(-200, -60, -150);
  scene.add(rim);
}

// ─────────────────────────────────────────────────────────────
// CONTROLS
// ─────────────────────────────────────────────────────────────
function buildControls(canvas) {
  canvas.addEventListener('mousedown', e=>{isDragging=true; prevMouse={x:e.clientX,y:e.clientY};});
  window.addEventListener('mouseup', ()=>{isDragging=false;});
  canvas.addEventListener('mousemove', e=>onMouseMove(e,canvas));
  canvas.addEventListener('mouseleave', hideTooltip);
  canvas.addEventListener('wheel', e=>{
    camera.position.z=Math.max(135,Math.min(620,camera.position.z+e.deltaY*0.28));
    e.preventDefault();
  },{passive:false});
  canvas.addEventListener('click', e=>onGlobeClick(e,canvas));

  document.querySelectorAll('.g-btn[data-layer]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const l=btn.dataset.layer;
      if(L[l]===undefined) return;
      L[l]=!L[l];
      btn.classList.toggle('on',L[l]);
      applyLayers();
    });
  });
  window.addEventListener('resize', ()=>{
    camera.aspect=canvas.clientWidth/canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth,canvas.clientHeight);
  });
}

function applyLayers() {
  flightObjs.forEach(o=>{o.mesh.visible=L.flights;});
  Object.values(satObjs).forEach(o=>{o.mesh.visible=L.sats; if(o.trail) o.trail.visible=L.sats;});
  shipObjs.forEach(o=>{o.mesh.visible=L.ships;});
  conflictObjs.forEach(o=>{o.marker.visible=L.conflicts; if(o.ring) o.ring.visible=L.conflicts;});
  cyberBeams.forEach(b=>{b.line.visible=L.cyber;});
  routeLines.forEach(r=>{r.visible=L.routes;});
  if(cloudMesh) cloudMesh.visible=L.clouds;
  if(nightMesh) nightMesh.visible=L.nightlights;
  weatherObjs.forEach(o=>{ o.mesh.visible=L.weather; });
  disasterObjs.forEach(o=>{ o.mesh.visible=L.disasters; if(o.ring) o.ring.visible=L.disasters; });
  globeGroup.traverse(c=>{
    if(c.userData.isCable)   c.visible=L.cables;
    if(c.userData.isCurrent) c.visible=L.currents;
    if(c.userData.isFire)    c.visible=L.wildfires;
    if(c.userData.isHeatmap) c.visible=L.heatmap;
  });
}

// ─────────────────────────────────────────────────────────────
// FLIGHTS
// ─────────────────────────────────────────────────────────────
function addFlights() {
  flightObjs.forEach(o=>globeGroup.remove(o.mesh));
  routeLines.forEach(r=>globeGroup.remove(r));
  flightObjs=[]; routeLines=[];

  const coneGeo = new THREE.ConeGeometry(0.55,2.5,5);
  coneGeo.rotateX(-Math.PI/2); // tip → +Z (destination direction)

  const mats = {
    cruise:  new THREE.MeshPhongMaterial({color:0x00c8ff, emissive:0x002244, shininess:30}),
    climb:   new THREE.MeshPhongMaterial({color:0x00ff88, emissive:0x003322, shininess:30}),
    descend: new THREE.MeshPhongMaterial({color:0xff8800, emissive:0x221100, shininess:30}),
  };

  APP.flights.slice(0,260).forEach(f=>{
    const mat = f.status==='climbing'?mats.climb:f.status==='descending'?mats.descend:mats.cruise;
    const mesh = new THREE.Mesh(coneGeo, mat.clone());
    const cur = lerpLL(f.originLat,f.originLon,f.destLat,f.destLon,f.progress);
    const brg = bearing(cur.lat,cur.lon,f.destLat,f.destLon);
    placeOnSphere(mesh,cur.lat,cur.lon,brg,R_FLT);
    mesh.visible=L.flights; globeGroup.add(mesh);

    const arcPts=[];
    for(let t=0;t<=1;t+=0.025){const ll=lerpLL(f.originLat,f.originLon,f.destLat,f.destLon,t);arcPts.push(ll2v(ll.lat,ll.lon,R+1.5));}
    const arc=new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts),
      new THREE.LineBasicMaterial({color:0x003a5c,transparent:true,opacity:0.3,blending:THREE.AdditiveBlending,depthWrite:false}));
    arc.visible=L.routes; globeGroup.add(arc); routeLines.push(arc);
    flightObjs.push({mesh,flight:f});
  });

  const el=document.getElementById('g-flight-count');
  if(el) el.textContent=`${APP.flights.length} TRACKED`;
  document.getElementById('sb-flights').textContent=APP.flights.length;
}

// ─────────────────────────────────────────────────────────────
// SATELLITES — full intelligence profiles + hover tooltip
// ─────────────────────────────────────────────────────────────
const SAT_COLORS = {
  ISS:    {body:0xffffff, trail:0x88aaff},
  STAR:   {body:0x44ffaa, trail:0x22cc88},
  LEO:    {body:0x00ccff, trail:0x0066aa},
  SPY:    {body:0xff2244, trail:0xaa0022},
  MEO:    {body:0x8888ff, trail:0x444488},
  GEO:    {body:0xffaa00, trail:0xaa6600},
  DEBRIS: {body:0x556677, trail:0x334455},
};

function addSatellites() {
  Object.values(satObjs).forEach(o=>{globeGroup.remove(o.mesh); if(o.trail) globeGroup.remove(o.trail);});
  satObjs={};

  const sats = APP.satellites || FALLBACK_SATS;

  sats.forEach(s=>{
    const cls = SAT_COLORS[s.type] || SAT_COLORS.LEO;
    const r   = R_SAT[s.type] || 122;
    const sz  = (s.size||1.0) * (s.id==='ISS'?2.2 : s.type==='GEO'?1.6 : 1.0);

    let mesh;
    if (s.id==='ISS') {
      const grp=new THREE.Group();
      grp.add(new THREE.Mesh(new THREE.BoxGeometry(sz*0.8,sz*0.3,sz*0.3),
        new THREE.MeshPhongMaterial({color:0xddddff,emissive:0x223355})));
      const panel=new THREE.Mesh(new THREE.BoxGeometry(sz*2.5,sz*0.05,sz*0.8),
        new THREE.MeshPhongMaterial({color:0x3355aa,emissive:0x001133}));
      grp.add(panel); mesh=grp;
    } else if (s.type==='DEBRIS') {
      mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(sz*0.4,0),
        new THREE.MeshPhongMaterial({color:cls.body,wireframe:true}));
    } else if (s.type==='STAR') {
      mesh=new THREE.Mesh(new THREE.BoxGeometry(sz*0.7,sz*0.15,sz*0.7),
        new THREE.MeshPhongMaterial({color:cls.body,emissive:new THREE.Color(cls.body).multiplyScalar(0.2)}));
    } else {
      mesh=new THREE.Mesh(new THREE.SphereGeometry(sz*0.5,6,6),
        new THREE.MeshPhongMaterial({color:cls.body,emissive:new THREE.Color(cls.body).multiplyScalar(0.15),shininess:40}));
    }

    // Slightly larger invisible hit sphere for easier raycasting
    const hitGeo = new THREE.SphereGeometry(sz*1.8, 6, 6);
    const hitMat = new THREE.MeshBasicMaterial({transparent:true, opacity:0, depthWrite:false});
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.userData.satId = s.id;
    hitMesh.userData.isHitSphere = true;

    const container = new THREE.Group();
    container.add(mesh);
    container.add(hitMesh);
    container.visible = L.sats;
    globeGroup.add(container);

    // Orbital trail ring
    const trailPts=[];
    for(let a=0;a<=Math.PI*2;a+=0.05) trailPts.push(new THREE.Vector3(r*Math.cos(a),0,r*Math.sin(a)));
    const trail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(trailPts),
      new THREE.LineBasicMaterial({color:cls.trail,transparent:true,opacity:0.10,
        blending:THREE.AdditiveBlending,depthWrite:false}));
    trail.visible=L.sats; globeGroup.add(trail);

    satObjs[s.id]={
      mesh:container, hitMesh, trail, sat:s, r,
      inclination:s.inclination||51.6, period:(s.period||92)*60, raan:s.raan||0,
    };
  });
}

// Update satellite positions each frame
function updateSatPositions() {
  const t = simTime;
  Object.values(satObjs).forEach(o=>{
    const n=(2*Math.PI)/o.period, M=(n*t)%(2*Math.PI);
    const inc=o.inclination*Math.PI/180;
    const raan=(o.raan*Math.PI/180)+(t*7.2921e-5);
    const xO=o.r*Math.cos(M), yO=o.r*Math.sin(M);
    const x=xO*Math.cos(raan)-yO*Math.cos(inc)*Math.sin(raan);
    const y=yO*Math.sin(inc);
    const z=xO*Math.sin(raan)+yO*Math.cos(inc)*Math.cos(raan);
    o.mesh.position.set(x,y,z);
    if(o.trail){o.trail.rotation.set(0,0,0); o.trail.rotateY(raan); o.trail.rotateX(-inc+Math.PI/2);}
    if(o.sat.id==='ISS') o.mesh.rotation.y=t*0.1;
  });
}

// ─────────────────────────────────────────────────────────────
// SHIPS
// ─────────────────────────────────────────────────────────────
const SHIP_COLORS={container:0x2288ff,tanker:0xff6600,bulk:0x888888,lng:0x00ffcc,naval:0xff2244,reefer:0xffffff};

function addShips() {
  shipObjs.forEach(o=>globeGroup.remove(o.mesh)); shipObjs=[];
  const ships=APP.ships||[];
  const hullGeo=new THREE.BoxGeometry(2.2,0.4,0.8);
  hullGeo.rotateX(-Math.PI/2);
  ships.slice(0,200).forEach(s=>{
    const col=SHIP_COLORS[s.type]||0x888888;
    const mat=new THREE.MeshPhongMaterial({color:col,emissive:new THREE.Color(col).multiplyScalar(0.08),shininess:20});
    const mesh=new THREE.Mesh(hullGeo,mat.clone());
    const brg=bearing(s.lat,s.lon,s.destLat,s.destLon);
    placeOnSphere(mesh,s.lat,s.lon,brg,R_SHIP);
    mesh.scale.setScalar(s.sizeScale||1.0);
    mesh.visible=L.ships; globeGroup.add(mesh);
    shipObjs.push({mesh,ship:s});
  });
  const el=document.getElementById('g-ship-count');
  if(el) el.textContent=`${ships.length} VESSELS`;
}

// ─────────────────────────────────────────────────────────────
// CONFLICT MARKERS
// ─────────────────────────────────────────────────────────────
function addConflicts() {
  conflictObjs.forEach(o=>{globeGroup.remove(o.marker); if(o.ring) globeGroup.remove(o.ring);}); conflictObjs=[];
  APP.conflicts.forEach(c=>{
    const col=c.severity==='critical'?0xff2244:c.severity==='high'?0xff6600:0xffaa00;
    const marker=new THREE.Mesh(new THREE.SphereGeometry(1.4,8,8),new THREE.MeshBasicMaterial({color:col}));
    const pos=ll2v(c.lat,c.lon,R+5);
    marker.position.copy(pos); marker.visible=L.conflicts; globeGroup.add(marker);
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.0,3.4,22),
      new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.5,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
    ring.position.copy(pos); ring.lookAt(0,0,0); ring.rotateX(Math.PI/2);
    ring.visible=L.conflicts; globeGroup.add(ring);
    conflictObjs.push({marker,ring,conflict:c,phase:Math.random()*Math.PI*2});
  });
  const el=document.getElementById('g-conflict-count');
  if(el) el.textContent=`${APP.conflicts.length} ACTIVE`;
  document.getElementById('sb-conflicts').textContent=APP.conflicts.length;
}

// ─────────────────────────────────────────────────────────────
// CYBER ATTACK BEAMS
// ─────────────────────────────────────────────────────────────
const CYBER_POOL=[
  {oLat:55.75,oLon:37.62, tLat:38.90,tLon:-77.04,col:0xff0022,actor:'APT-28 / Russia'},
  {oLat:39.91,oLon:116.39,tLat:37.57,tLon:126.98,col:0xff4400,actor:'APT-40 / China'},
  {oLat:39.02,oLon:125.75,tLat:40.71,tLon:-74.01,col:0xffaa00,actor:'Lazarus / DPRK'},
  {oLat:35.69,oLon:51.39, tLat:32.08,tLon:34.78, col:0xff6600,actor:'APT-35 / Iran'},
  {oLat:31.23,oLon:121.47,tLat:51.51,tLon:-0.13, col:0xff4400,actor:'APT-41 / China'},
  {oLat:59.94,oLon:30.31, tLat:50.45,tLon:30.52, col:0xff0000,actor:'Sandworm / Russia'},
  {oLat:39.91,oLon:116.39,tLat:38.90,tLon:-77.04,col:0xff5500,actor:'Volt Typhoon'},
  {oLat:55.75,oLon:37.62, tLat:52.52,tLon:13.40, col:0xff1133,actor:'APT-29 / Russia'},
];

function addCyberBeams() {
  cyberBeams.forEach(b=>globeGroup.remove(b.line)); cyberBeams=[];
  CYBER_POOL.forEach((c,i)=>{
    const o=ll2v(c.oLat,c.oLon,R+3), t=ll2v(c.tLat,c.tLon,R+3);
    const mid=o.clone().add(t).normalize().multiplyScalar(R+28+Math.random()*18);
    const pts=[];
    for(let j=0;j<=24;j++){
      const s=j/24;
      pts.push(o.clone().multiplyScalar((1-s)*(1-s)).add(mid.clone().multiplyScalar(2*s*(1-s))).add(t.clone().multiplyScalar(s*s)));
    }
    const mat=new THREE.LineBasicMaterial({color:c.col,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat);
    line.visible=L.cyber; globeGroup.add(line);
    cyberBeams.push({line,col:c.col,actor:c.actor,phase:(i/CYBER_POOL.length)*Math.PI*2,pulseSpeed:0.8+Math.random()*0.6});
  });
}

// Heat rings around conflict zones
function buildHeatmapRings() {
  APP.conflicts.filter(c=>c.severity==='critical'||c.severity==='high').forEach(c=>{
    [8,14,20].forEach((r,i)=>{
      const ring=new THREE.Mesh(new THREE.RingGeometry(r,r+1.5,32),
        new THREE.MeshBasicMaterial({color:c.severity==='critical'?0xff2244:0xff6600,
          transparent:true,opacity:0.055-i*0.015,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
      const pos=ll2v(c.lat,c.lon,R+0.3);
      ring.position.copy(pos); ring.lookAt(0,0,0); ring.rotateX(Math.PI/2);
      ring.visible=L.heatmap; ring.userData.isHeatmap=true;
      ring.userData.phase=Math.random()*Math.PI*2; ring.userData.speed=0.004+i*0.002;
      globeGroup.add(ring);
    });
  });
}

// Lightning
const LFSPOTS=[{lat:10,lon:-75},{lat:5,lon:25},{lat:15,lon:100},{lat:-15,lon:130},{lat:25,lon:90}];
function triggerLightning() {
  const s=LFSPOTS[Math.floor(Math.random()*LFSPOTS.length)];
  const pts=[],base=ll2v(s.lat,s.lon,R+1),dir=base.clone().normalize();
  let cur=base.clone();
  for(let i=0;i<8;i++){pts.push(cur.clone());cur.addScaledVector(dir,3+Math.random()*5);cur.x+=(Math.random()-0.5)*2;cur.y+=(Math.random()-0.5)*2;cur.z+=(Math.random()-0.5)*2;}
  const flash=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.92,blending:THREE.AdditiveBlending,depthWrite:false}));
  globeGroup.add(flash);
  setTimeout(()=>globeGroup.remove(flash),110);
}

// ─────────────────────────────────────────────────────────────
// SATELLITE TOOLTIP — rich intelligence card
// ─────────────────────────────────────────────────────────────
function threatColor(threat) {
  if (!threat) return 'var(--txt-4)';
  const t = threat.toUpperCase();
  if (t.includes('STRATEGIC') || t.includes('HIGH')) return 'var(--crit)';
  if (t.includes('MEDIUM'))     return 'var(--med)';
  if (t.includes('DEFENSIVE'))  return 'var(--acc4)';
  if (t.includes('COLLISION'))  return 'var(--high)';
  return 'var(--txt-4)';
}

function classificationBg(cls) {
  if (!cls) return 'rgba(80,80,80,0.15)';
  const c = cls.toUpperCase();
  if (c.includes('TOP SECRET'))    return 'rgba(244,63,94,0.18)';
  if (c.includes('SECRET'))        return 'rgba(249,115,22,0.18)';
  if (c.includes('CLASSIFIED'))    return 'rgba(245,158,11,0.18)';
  if (c.includes('MILITARY'))      return 'rgba(139,92,246,0.18)';
  return 'rgba(56,189,248,0.10)';
}

function typeIcon(type) {
  const icons = {ISS:'🛸',STAR:'🌐',LEO:'🛰',SPY:'👁',MEO:'📡',GEO:'📡',DEBRIS:'⚠'};
  return icons[type] || '🛰';
}

function showSatTooltip(e, sat, canvas) {
  if (!sat) return;
  const tt = document.getElementById('flight-tooltip');
  const rect = canvas.getBoundingClientRect();
  const orbitAlt = {ISS:'408 km',STAR:'550 km',LEO:'200-2000 km',SPY:'100-600 km',MEO:'2000-35786 km',GEO:'35786 km',DEBRIS:'various'}[sat.type] || '—';
  const periodStr = sat.period < 200 ? `${sat.period} min` : sat.period > 1000 ? `24h (geostationary)` : `${sat.period} min`;
  tt.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:18px">${sat.flag || '🛰'}</span>
      <div>
        <div class="cs">${sat.shortName || sat.name}</div>
        <div style="font-size:9px;color:var(--txt-3);letter-spacing:0.5px">${sat.nation || 'Unknown'}</div>
      </div>
      <span style="margin-left:auto;font-size:18px">${typeIcon(sat.type)}</span>
    </div>
    <div style="border-top:1px solid var(--edge);padding-top:7px;margin-bottom:7px">
      <div style="font-size:10px;color:var(--txt-2);margin-bottom:3px"><strong style="color:var(--acc-vivid)">Purpose:</strong> ${sat.purpose || sat.type}</div>
      <div style="font-size:9px;color:var(--txt-3)"><strong>Orbit:</strong> ${sat.orbitType || sat.type} · ${orbitAlt}</div>
      <div style="font-size:9px;color:var(--txt-3)"><strong>Period:</strong> ${periodStr} · Inc: ${sat.inclination}°</div>
      <div style="font-size:9px;color:var(--txt-3);margin-top:2px"><strong>Owner:</strong> ${sat.owner ? sat.owner.split('/')[0].trim() : sat.nation}</div>
      <div style="font-size:9px;color:var(--txt-3)"><strong>Launched:</strong> ${sat.launched || 'Unknown'} · Status: <span style="color:${sat.status==='OPERATIONAL'||sat.status==='ACTIVE'?'var(--acc4)':'var(--txt-3)'}">${sat.status || 'Unknown'}</span></div>
    </div>
    ${sat.classification ? `<div style="display:inline-block;font-size:8px;font-weight:700;letter-spacing:1.5px;padding:2px 8px;border-radius:20px;background:${classificationBg(sat.classification)};color:${sat.classification.toUpperCase().includes('SECRET')?'var(--crit)':sat.classification.toUpperCase().includes('MILITARY')?'#a78bfa':'var(--acc)'};margin-bottom:7px;text-transform:uppercase">${sat.classification}</div>` : ''}
    <div style="font-size:9px;color:var(--txt-3);line-height:1.5;border-top:1px solid var(--edge);padding-top:7px;max-width:260px">${(sat.description||'').slice(0,160)}${(sat.description||'').length>160?'…':''}</div>
    <div style="margin-top:7px;font-size:8px;color:${threatColor(sat.threat)}">⚡ THREAT LEVEL: ${sat.threat || 'NONE'}</div>
    <div style="margin-top:5px;font-size:8px;color:var(--txt-4);letter-spacing:0.5px">Click for full intel profile</div>
  `;
  tt.style.display = 'block';
  // Position: avoid going off-screen
  let left = e.clientX - rect.left + 18;
  let top  = e.clientY - rect.top  - 20;
  if (left + 300 > rect.width)  left = e.clientX - rect.left - 310;
  if (top  + 320 > rect.height) top  = e.clientY - rect.top  - 320;
  tt.style.left = Math.max(4, left) + 'px';
  tt.style.top  = Math.max(4, top)  + 'px';
}

function showSatModal(sat) {
  if (!sat) return;
  const caps = (sat.capabilities||[]).map(c=>`<li style="color:var(--txt-3);font-size:11px;margin-bottom:3px">${c}</li>`).join('');
  openModal(`
    <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:20px">
      <div style="font-size:48px;line-height:1">${sat.flag||'🛰'}</div>
      <div>
        <h2 style="margin-bottom:4px">${sat.name}</h2>
        <div style="font-size:12px;color:var(--txt-3);">${sat.nation} · ${sat.type} · ${sat.orbitType||'Low Earth Orbit'}</div>
        <div style="margin-top:8px;display:flex;gap:7px;flex-wrap:wrap">
          <span class="sev-badge ${sat.status==='OPERATIONAL'||sat.status==='ACTIVE'?'low':'medium'}">${sat.status||'UNKNOWN'}</span>
          ${sat.classification ? `<div style="display:inline-block;font-size:8px;font-weight:700;letter-spacing:1.5px;padding:2px 8px;border-radius:20px;background:${classificationBg(sat.classification)};color:${sat.classification.toUpperCase().includes('SECRET')?'var(--crit)':sat.classification.toUpperCase().includes('MILITARY')?'#a78bfa':'var(--acc)'};text-transform:uppercase">${sat.classification}</div>` : ''}
          <div style="display:inline-block;font-size:8px;font-weight:700;letter-spacing:1.5px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.06);color:var(--txt-3);text-transform:uppercase">${sat.type}</div>
        </div>
      </div>
    </div>

    <h3>INTELLIGENCE OVERVIEW</h3>
    <p style="color:var(--txt-3);font-size:12px;line-height:1.75;margin-bottom:16px">${sat.description||'No description available.'}</p>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
      <div class="stat-card"><div class="v">${sat.altKm ? sat.altKm.toLocaleString()+' km' : '—'}</div><div class="l">Altitude</div></div>
      <div class="stat-card"><div class="v">${sat.inclination}°</div><div class="l">Inclination</div></div>
      <div class="stat-card"><div class="v">${sat.period < 200 ? sat.period+'m' : sat.period > 1000 ? 'GEO' : sat.period+'m'}</div><div class="l">Orbital Period</div></div>
      <div class="stat-card"><div class="v" style="font-size:12px">${sat.launched||'—'}</div><div class="l">Launch Date</div></div>
      <div class="stat-card"><div class="v" style="font-size:11px;color:${threatColor(sat.threat)}">${sat.threat||'NONE'}</div><div class="l">Threat Level</div></div>
      <div class="stat-card"><div class="v" style="font-size:11px">${(sat.owner||sat.nation||'—').split('/')[0].trim()}</div><div class="l">Operator</div></div>
    </div>

    <h3>FULL OWNER / OPERATOR</h3>
    <p style="color:var(--txt-2);font-size:12px;margin-bottom:14px">${sat.owner||sat.nation||'Unknown'}</p>

    <h3>KNOWN CAPABILITIES</h3>
    <ul style="padding-left:18px;margin-bottom:14px">${caps}</ul>

    <h3>PURPOSE & MISSION</h3>
    <p style="color:var(--txt-2);font-size:12px">${sat.purpose||'—'}</p>
  `);
}

// ─────────────────────────────────────────────────────────────
// INTERACTION
// ─────────────────────────────────────────────────────────────
function getRay(e, canvas) {
  const rect=canvas.getBoundingClientRect();
  const m=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
  const ray=new THREE.Raycaster(); ray.setFromCamera(m,camera); return ray;
}

function getHitSpheres() {
  const hs=[];
  Object.values(satObjs).forEach(o=>{ if(o.hitMesh) hs.push(o.hitMesh); });
  return hs;
}

function onMouseMove(e, canvas) {
  if (isDragging) {
    const dx=e.clientX-prevMouse.x, dy=e.clientY-prevMouse.y;
    rotVelY=dx*0.0038; rotVelX=dy*0.0038;
    globeGroup.rotation.y+=rotVelY;
    globeGroup.rotation.x=Math.max(-1.35,Math.min(1.35,globeGroup.rotation.x+rotVelX));
    prevMouse={x:e.clientX,y:e.clientY}; return;
  }
  if (pinnedTarget) return;

  const ray = getRay(e,canvas);

  // Check satellites first (priority hover)
  const satHits = ray.intersectObjects(getHitSpheres(), false);
  if (satHits.length) {
    const hitId = satHits[0].object.userData.satId;
    const satData = (APP.satellites||FALLBACK_SATS).find(s=>s.id===hitId);
    if (satData) { hoveredSat = satData; showSatTooltip(e, satData, canvas); return; }
  }
  hoveredSat = null;

  // Check weather markers
  const wHits = ray.intersectObjects(weatherObjs.map(o=>o.mesh));
  if (wHits.length) {
    const wo = weatherObjs.find(o => o.mesh === wHits[0].object);
    if (wo) { showWeatherTooltip(e, wo.data, canvas); return; }
  }

  // Check disaster markers
  const dHits = ray.intersectObjects(disasterObjs.map(o=>o.mesh));
  if (dHits.length) {
    const dobj = disasterObjs.find(o => o.mesh === dHits[0].object);
    if (dobj) { showDisasterTooltip(e, dobj.data, canvas); return; }
  }

  // Check flights
  const fHits=ray.intersectObjects(flightObjs.map(o=>o.mesh));
  if (fHits.length) {
    const fo=flightObjs.find(o=>o.mesh===fHits[0].object);
    if (fo) { showFlightTooltip(e,fo.flight,canvas); return; }
  }

  // Check ships
  const sHits=ray.intersectObjects(shipObjs.map(o=>o.mesh));
  if (sHits.length) {
    const so=shipObjs.find(o=>o.mesh===sHits[0].object);
    if (so) { showShipTooltip(e,so.ship,canvas); return; }
  }

  hideTooltip();
}

function onGlobeClick(e, canvas) {
  if (Math.abs(rotVelX)>0.015||Math.abs(rotVelY)>0.015) return;
  const ray=getRay(e,canvas);

  // Satellites
  const satHits=ray.intersectObjects(getHitSpheres(),false);
  if (satHits.length) {
    const hitId=satHits[0].object.userData.satId;
    const satData=(APP.satellites||FALLBACK_SATS).find(s=>s.id===hitId);
    if (satData) { showSatModal(satData); return; }
  }

  // Flights
  const fHits=ray.intersectObjects(flightObjs.map(o=>o.mesh));
  if (fHits.length) { const fo=flightObjs.find(o=>o.mesh===fHits[0].object); if(fo){pinFlight(fo.flight);return;} }

  // Ships
  const sHits=ray.intersectObjects(shipObjs.map(o=>o.mesh));
  if (sHits.length) { const so=shipObjs.find(o=>o.mesh===sHits[0].object); if(so){pinShip(so.ship);return;} }

  // Conflicts
  const cHits=ray.intersectObjects(conflictObjs.map(o=>o.marker));
  if (cHits.length) { const co=conflictObjs.find(o=>o.marker===cHits[0].object); if(co){showConflictModal(co.conflict);return;} }

  pinnedTarget=null;
  document.getElementById('flight-card').style.display='none';
  hideTooltip();
}

function showTT(e,html,canvas){
  const tt=document.getElementById('flight-tooltip'),rect=canvas.getBoundingClientRect();
  tt.innerHTML=html; tt.style.display='block';
  let left=e.clientX-rect.left+16, top=e.clientY-rect.top-20;
  if(left+290>rect.width) left=e.clientX-rect.left-300;
  tt.style.left=Math.max(4,left)+'px'; tt.style.top=Math.max(4,top)+'px';
}

function hideTooltip(){const tt=document.getElementById('flight-tooltip'); if(tt) tt.style.display='none';}

function showFlightTooltip(e,f,canvas){
  if(!f) return;
  const cur=lerpLL(f.originLat,f.originLon,f.destLat,f.destLon,f.progress);
  const brg=bearing(cur.lat,cur.lon,f.destLat,f.destLon);
  showTT(e,`<div class="cs">✈ ${f.callsign}</div>
    <div class="rt">${f.originCity} → ${f.destCity}</div>
    <div>${f.aircraft} · ${(f.altitude||0).toLocaleString()}ft · ${f.speed}kts</div>
    <div style="color:var(--td);font-size:9px;margin-top:3px">HDG ${Math.round(brg)}° · ETA ${fmtEta(f.etaMins)} · ${(f.status||'cruise').toUpperCase()}</div>`,canvas);
}

function showShipTooltip(e,s,canvas){
  if(!s) return;
  showTT(e,`<div class="cs">${s.flag} ${s.name}</div>
    <div class="rt" style="color:var(--acc)">${s.typeName}</div>
    <div>${s.shippingLine} · ${s.cargo}</div>
    <div style="color:var(--td);font-size:9px;margin-top:3px">${s.speedKnots}kts · ${s.status} · ETA ${s.eta}</div>`,canvas);
}

function pinFlight(f){
  pinnedTarget=f; hideTooltip();
  const cur=lerpLL(f.originLat,f.originLon,f.destLat,f.destLon,f.progress);
  const brg=bearing(cur.lat,cur.lon,f.destLat,f.destLon);
  const card=document.getElementById('flight-card');
  card.innerHTML=`
    <div class="cs">✈ ${f.callsign} · ${f.aircraft}</div>
    <div class="rt">${f.originCity} (${f.origin}) → ${f.destCity} (${f.destination})</div>
    <div class="metrics">
      <div class="metric"><div class="v">${(f.altitude||0).toLocaleString()}</div><div class="l">ALT ft</div></div>
      <div class="metric"><div class="v">${f.speed}</div><div class="l">SPD kts</div></div>
      <div class="metric"><div class="v">${Math.round(brg)}°</div><div class="l">HDG</div></div>
      <div class="metric"><div class="v">${fmtEta(f.etaMins)}</div><div class="l">ETA</div></div>
      <div class="metric"><div class="v">${Math.round(f.progress*100)}%</div><div class="l">DONE</div></div>
    </div>
    <div style="margin-top:8px;font-size:9px;color:var(--ts)">${(f.status||'').toUpperCase()} · ${f.airline||''}</div>
    <div style="color:var(--td);font-size:8px;margin-top:8px;cursor:pointer;letter-spacing:1px"
         onclick="document.getElementById('flight-card').style.display='none'">[ DISMISS ]</div>`;
  card.style.display='block';
}

function pinShip(s){
  pinnedTarget=s; hideTooltip();
  const card=document.getElementById('flight-card');
  card.innerHTML=`
    <div class="cs">${s.flag} ${s.name}</div>
    <div class="rt" style="color:var(--acc3)">${s.typeName} · ${s.shippingLine}</div>
    <div class="metrics">
      <div class="metric"><div class="v">${s.speedKnots}</div><div class="l">kts</div></div>
      <div class="metric"><div class="v">${s.eta}</div><div class="l">ETA</div></div>
      <div class="metric"><div class="v">${(s.dwt||0).toLocaleString()}</div><div class="l">DWT</div></div>
    </div>
    <div style="margin-top:8px;font-size:10px;color:var(--ts)">CARGO: ${s.cargo}</div>
    <div style="font-size:9px;color:var(--td);margin-top:4px">MMSI: ${s.mmsi}</div>
    <div style="color:var(--td);font-size:8px;margin-top:8px;cursor:pointer;letter-spacing:1px"
         onclick="document.getElementById('flight-card').style.display='none'">[ DISMISS ]</div>`;
  card.style.display='block';
}

function showWeatherTooltip(e, w, canvas) {
  const windDir = w.windKmh > 0 ? '💨' : '';
  showTT(e, `
    <div class="cs">${w.icon} ${w.city}, ${w.country}</div>
    <div class="rt" style="color:var(--acc);font-size:13px;font-weight:700">${w.temp}°C</div>
    <div style="font-size:10px;color:var(--txt-2);margin-bottom:4px">${w.condition}</div>
    <div style="color:var(--txt-3);font-size:9px">
      ${windDir} Wind: ${w.windKmh} km/h (gusts ${w.gustsKmh}) &nbsp;·&nbsp;
      💧 Humidity: ${w.humidity}% &nbsp;·&nbsp;
      🌡 Pressure: ${w.pressure} hPa
    </div>
    ${w.precipitation > 0 ? `<div style="color:#4488ff;font-size:9px;margin-top:3px">🌧 Precipitation: ${w.precipitation}mm</div>` : ''}
    ${w.severity !== 'low' ? `<div style="margin-top:5px"><span class="sev-badge ${w.severity}">${w.severity.toUpperCase()} WEATHER</span></div>` : ''}
    <div style="color:var(--txt-4);font-size:8px;margin-top:4px">Source: Open-Meteo · Live</div>
  `, canvas);
}

function showDisasterTooltip(e, d, canvas) {
  showTT(e, `
    <div class="cs">${d.icon} ${d.title}</div>
    <div style="color:var(--txt-3);font-size:9px;margin:4px 0">${d.country}</div>
    <div style="display:flex;gap:6px;margin-bottom:5px">
      <span class="sev-badge ${d.severity}">${d.severity.toUpperCase()}</span>
      <span style="font-size:8px;color:var(--txt-4);text-transform:uppercase;letter-spacing:1px">${(d.type||'').replace(/_/g,' ')}</span>
    </div>
    ${d.description ? `<div style="font-size:9px;color:var(--txt-3);line-height:1.5;max-width:250px">${d.description.slice(0,150)}${d.description.length>150?'…':''}</div>` : ''}
    <div style="color:var(--txt-4);font-size:8px;margin-top:5px">Source: ${d.source || 'GDACS'} · ${formatTime(d.date)}</div>
  `, canvas);
}

function showConflictModal(c){
  openModal(`<h2>${c.name}</h2>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <span class="sev-badge ${c.severity}">${c.severity.toUpperCase()}</span>
      <span class="sev-badge low">${(c.type||'').replace(/_/g,' ').toUpperCase()}</span>
      <span class="sev-badge medium">${c.status.toUpperCase()}</span>
    </div>
    <p style="color:var(--txt-3);font-size:12px;line-height:1.65;margin-bottom:14px">${c.description||''}</p>
    <h3>CASUALTIES</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
      <div class="stat-card crit"><div class="v">${c.casualtiesTotal}</div><div class="l">TOTAL</div></div>
      <div class="stat-card"><div class="v">${c.casualtiesMil}</div><div class="l">MILITARY</div></div>
      <div class="stat-card"><div class="v">${c.casualtiesCiv}</div><div class="l">CIVILIAN</div></div>
    </div>
    <h3>FORCES</h3>
    ${(c.forces||[]).map(f=>`<div style="background:rgba(0,200,255,.04);border:1px solid var(--edge);border-radius:var(--r-md);padding:10px;margin-bottom:8px">
      <div style="font-weight:700;color:var(--acc-vivid);margin-bottom:6px">${f.side}</div>
      <div style="font-size:11px;color:var(--txt-3)">Personnel: ${f.personnel} · Tanks: ${f.tanks} · Aircraft: ${f.aircraft}</div>
      <div style="font-size:10px;color:var(--txt-4);margin-top:3px">Backers: ${f.mainBackers}</div></div>`).join('')}
    <h3>ACTIVE FRONTS</h3>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
      ${(c.fronts||[]).map(f=>`<span class="front-tag">${f}</span>`).join('')}
    </div>`);
}

// ─────────────────────────────────────────────────────────────
// FALLBACK SATS
// ─────────────────────────────────────────────────────────────
const FALLBACK_SATS = [
  {id:'ISS',   name:'International Space Station', shortName:'ISS',    nation:'International',  flag:'🌍', type:'LEO',   orbitType:'Low Earth Orbit',    altKm:408,   inclination:51.6, period:92,   raan:0,   size:2.2, color:0xffffff, purpose:'Crewed Research Station',        status:'OPERATIONAL', launched:'1998',    owner:'NASA / ESA / Roscosmos', description:'Largest human-made structure in orbit. Continuous human presence since 2000. Conducts microgravity research.',                             capabilities:['Microgravity research','Earth observation'], classification:'CIVILIAN',  threat:'NONE'},
  {id:'KH-13', name:'KH-13 Keyhole',               shortName:'KH-13',  nation:'United States',  flag:'🇺🇸', type:'SPY',   orbitType:'SSO Reconnaissance', altKm:300,   inclination:97.9, period:96,   raan:45,  size:1.4, color:0xff2244, purpose:'Optical Reconnaissance',         status:'CLASSIFIED',  launched:'2023',    owner:'NRO', description:'Most advanced US optical reconnaissance satellite. Sub-10cm ground resolution. Real-time imagery for intelligence agencies.',                   capabilities:['High-res optical imaging','Real-time downlink'], classification:'TOP SECRET', threat:'STRATEGIC'},
  {id:'KOS-2558',name:'Kosmos-2558',               shortName:'KOS-2558',nation:'Russia',         flag:'🇷🇺', type:'SPY',   orbitType:'LEO Inspector',      altKm:550,   inclination:97.6, period:97,   raan:75,  size:1.3, color:0xff3300, purpose:'Inspector / ASAT',               status:'ACTIVE',      launched:'2022',    owner:'Russian Space Forces', description:'Tracks western satellites. Suspected ASAT capabilities. Demonstrated proximity operations with USA-326.',                                   capabilities:['Satellite inspection','Proximity ops','ASAT potential'], classification:'MILITARY', threat:'HIGH'},
  {id:'SL-0',  name:'Starlink-2000',               shortName:'SL-2000',nation:'United States',  flag:'🇺🇸', type:'STAR',  orbitType:'Low Earth Orbit',    altKm:550,   inclination:53.0, period:95,   raan:0,   size:0.9, color:0x44ffaa, purpose:'Broadband Internet / Mil Comms', status:'OPERATIONAL', launched:'2023',    owner:'SpaceX (DoD contracts)', description:'Part of SpaceX Starlink mega-constellation. Used extensively by Ukraine military for drone ops and battlefield comms.',                       capabilities:['Global broadband','Military comms','Anti-jam'], classification:'COMMERCIAL (military use)', threat:'NONE'},
  {id:'SL-1',  name:'Starlink-2047',               shortName:'SL-2047',nation:'United States',  flag:'🇺🇸', type:'STAR',  orbitType:'Low Earth Orbit',    altKm:550,   inclination:53.0, period:95,   raan:60,  size:0.9, color:0x44ffaa, purpose:'Broadband Internet',             status:'OPERATIONAL', launched:'2023',    owner:'SpaceX', description:'Part of SpaceX Starlink constellation providing global broadband.',                                                                           capabilities:['Global broadband','Low latency comms'], classification:'COMMERCIAL', threat:'NONE'},
  {id:'SL-2',  name:'Starlink-2094',               shortName:'SL-2094',nation:'United States',  flag:'🇺🇸', type:'STAR',  orbitType:'Low Earth Orbit',    altKm:550,   inclination:63.0, period:95,   raan:120, size:0.9, color:0x44ffaa, purpose:'Broadband Internet',             status:'OPERATIONAL', launched:'2023',    owner:'SpaceX', description:'Part of SpaceX Starlink constellation providing global broadband.',                                                                           capabilities:['Global broadband'], classification:'COMMERCIAL', threat:'NONE'},
  {id:'GPS-1', name:'GPS III SV-01',               shortName:'GPS III',nation:'United States',  flag:'🇺🇸', type:'MEO',   orbitType:'Medium Earth Orbit', altKm:20200, inclination:55.0, period:720,  raan:60,  size:1.4, color:0x8888ff, purpose:'Navigation / Positioning',       status:'OPERATIONAL', launched:'2018',    owner:'US Space Force / Lockheed Martin', description:'3rd gen GPS with 3× better accuracy and 8× anti-jamming. Military M-code signal. Guides precision munitions.',                              capabilities:['Military GPS','Anti-jam','Nuclear detonation detect'], classification:'DUAL USE', threat:'NONE'},
  {id:'GPS-2', name:'GPS III SV-02',               shortName:'GPS III',nation:'United States',  flag:'🇺🇸', type:'MEO',   orbitType:'Medium Earth Orbit', altKm:20200, inclination:55.0, period:720,  raan:120, size:1.4, color:0x8888ff, purpose:'Navigation / Positioning',       status:'OPERATIONAL', launched:'2019',    owner:'US Space Force', description:'GPS III Block constellation satellite.',                                                                                                         capabilities:['Military GPS','Civilian navigation'], classification:'DUAL USE', threat:'NONE'},
  {id:'GOES',  name:'GOES-18',                     shortName:'GOES-18',nation:'United States',  flag:'🇺🇸', type:'GEO',   orbitType:'Geostationary',      altKm:35786, inclination:0.0,  period:1436, raan:100, size:1.5, color:0xff8800, purpose:'Weather / Earth Observation',    status:'OPERATIONAL', launched:'2022',    owner:'NOAA / NASA', description:'Geostationary weather satellite covering Americas. Provides real-time hurricane tracking, atmospheric imaging.',                             capabilities:['Weather forecasting','Hurricane tracking','Lightning mapping'], classification:'CIVILIAN', threat:'NONE'},
  {id:'YAOGAN',name:'Yaogan-35',                   shortName:'YG-35',  nation:'China',          flag:'🇨🇳', type:'SPY',   orbitType:'LEO Reconnaissance', altKm:500,   inclination:35.0, period:90,   raan:20,  size:1.3, color:0xff4400, purpose:'Radar/Optical Reconnaissance',   status:'OPERATIONAL', launched:'2022',    owner:'PLA Strategic Support Force', description:'SAR + optical sensors. Monitors US carrier groups and Indo-Pacific military facilities. Anti-carrier targeting role.',                       capabilities:['SAR imaging','Maritime surveillance','Anti-carrier targeting'], classification:'MILITARY', threat:'HIGH'},
  {id:'BDS',   name:'BeiDou-3 GEO',               shortName:'BDS',    nation:'China',          flag:'🇨🇳', type:'GEO',   orbitType:'Geostationary',      altKm:35786, inclination:2.0,  period:1436, raan:140, size:1.5, color:0xee4400, purpose:'Navigation / Positioning',       status:'OPERATIONAL', launched:'2018',    owner:'China Satellite Navigation Office', description:'China BeiDou-3 navigation system. Reduces GPS dependency. Integrated into PLA precision-guided weapons systems.',                           capabilities:['Military navigation','Precision guidance'], classification:'DUAL USE', threat:'NONE'},
  {id:'DB1',   name:'Debris Object 7001',          shortName:'DEB-7001',nation:'Unknown',       flag:'❓',  type:'DEBRIS',orbitType:'Uncontrolled',       altKm:450,   inclination:45.0, period:92,   raan:110, size:0.7, color:0x445566, purpose:'None (Space Debris)',            status:'UNCONTROLLED',launched:'Unknown', owner:'Unknown', description:'Tracked space debris. Fragment from old rocket body or satellite breakup. Poses collision risk.',                                              capabilities:['None — collision hazard'], classification:'NONE', threat:'COLLISION RISK'},
  {id:'OFEK',  name:'Ofeq-16',                     shortName:'OFEK-16',nation:'Israel',         flag:'🇮🇱', type:'SPY',   orbitType:'Retrograde LEO',     altKm:600,   inclination:142.9,period:95,   raan:50,  size:1.2, color:0xffcc00, purpose:'Electro-optical Reconnaissance', status:'OPERATIONAL', launched:'2020',    owner:'Israeli MoD / IAI', description:'Retrograde orbit avoids overflight of hostile states. Sub-50cm resolution. Covers Iran, Syria, and the broader Middle East.',                capabilities:['High-res optical','IR sensors','Near-real-time downlink'], classification:'SECRET', threat:'STRATEGIC'},
  {id:'SENT',  name:'Sentinel-1A',                 shortName:'S1A',    nation:'European Union', flag:'🇪🇺', type:'LEO',   orbitType:'Sun-Synchronous',    altKm:693,   inclination:98.2, period:99,   raan:260, size:1.2, color:0x4488ff, purpose:'SAR Earth Observation',          status:'OPERATIONAL', launched:'2014',    owner:'ESA / Copernicus', description:'All-weather SAR Earth observation. Used for troop movement monitoring, ship tracking, conflict damage assessment.',                            capabilities:['All-weather SAR','Ship tracking','Displacement mapping'], classification:'CIVILIAN (dual use)', threat:'NONE'},
];

// ─────────────────────────────────────────────────────────────
// SIDE PANEL RENDERERS
// ─────────────────────────────────────────────────────────────
window.showConflictModalById = id => {
  const c=APP.conflicts.find(x=>x.id===id); if(c) showConflictModal(c);
};

function renderConflictList() {
  const el=document.getElementById('g-conflict-list'); if(!el) return;
  el.innerHTML=APP.conflicts.map(c=>`
    <div class="g-conflict-item fade-in" onclick="showConflictModalById('${c.id}')">
      <div class="nm"><span class="pulse-dot ${c.severity==='critical'?'crit':'high'}" style="margin-right:5px"></span>${c.name}</div>
      <div class="lc">${c.country} · ${c.region}</div>
      <div class="row"><span class="sev-badge ${c.severity}">${c.severity.toUpperCase()}</span><span style="font-size:9px;color:var(--txt-4)">${c.casualtiesTotal}</span></div>
    </div>`).join('');
}

function renderFlightList() {
  const el=document.getElementById('g-flight-list'); if(!el) return;
  el.innerHTML=APP.flights.slice(0,20).map(f=>`
    <div class="g-flight-item">
      <div class="cs">✈ ${f.callsign} <span style="color:var(--txt-4);font-size:8px">${f.aircraft}</span></div>
      <div class="rt">${f.originCity} → ${f.destCity}</div>
    </div>`).join('');
}

function renderNewsList() {
  const el=document.getElementById('g-news-list'); if(!el) return;
  el.innerHTML=APP.news.slice(0,25).map(a=>`
    <div class="g-news-item fade-in" onclick="window.openArticleReader&&window.openArticleReader('${a.id}')">
      ${a.breaking?'<span style="color:var(--crit);font-size:8px;letter-spacing:2px">● BREAKING</span><br>':''}
      <div class="hl">${a.headline}</div>
      <div class="meta"><span class="src">${a.source}</span><span>${a.region}</span><span>${formatTime(a.timestamp)}</span></div>
    </div>`).join('');
  const e2=document.getElementById('g-news-count'); if(e2) e2.textContent=`${APP.news.length} ITEMS`;
}

function updateTicker() {
  const el=document.getElementById('globe-ticker-text'); if(!el||!APP.news.length) return;
  el.textContent=APP.news.slice(0,8).map(a=>`⬡ ${a.source.toUpperCase()}: ${a.headline}`).join('   ·   ');
}

// ─────────────────────────────────────────────────────────────
// WEATHER CITY MARKERS — real temperature / condition dots
// ─────────────────────────────────────────────────────────────
function buildWeatherMarkers() {
  weatherObjs.forEach(o => globeGroup.remove(o.mesh));
  weatherObjs = [];
  const cities = APP.weather || [];
  cities.forEach(w => {
    const col = w.temp > 38 ? 0xff4400   // extreme heat
              : w.temp > 30 ? 0xff8800   // hot
              : w.temp < -20? 0x8888ff   // extreme cold
              : w.temp < 0  ? 0x4488ff   // cold
              : w.weatherCode >= 95 ? 0xff2244  // thunderstorm
              : w.weatherCode >= 61 ? 0x2299ff  // rain
              : w.weatherCode >= 71 ? 0xaaccff  // snow
              : 0x44ddaa;                // fine

    const sz = w.severity === 'critical' ? 1.8 : w.severity === 'high' ? 1.4 : 1.0;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(sz, 6, 6),
      new THREE.MeshBasicMaterial({ color: col })
    );
    mesh.position.copy(ll2v(w.lat, w.lon, R + 3.5));
    mesh.visible = L.weather;
    mesh.userData.isWeather = true;
    mesh.userData.weatherData = w;
    globeGroup.add(mesh);
    weatherObjs.push({ mesh, data: w, phase: Math.random() * Math.PI * 2 });
  });
}

// ─────────────────────────────────────────────────────────────
// DISASTER MARKERS — hurricanes, earthquakes, floods etc.
// ─────────────────────────────────────────────────────────────
function buildDisasterMarkers() {
  disasterObjs.forEach(o => { globeGroup.remove(o.mesh); if(o.ring) globeGroup.remove(o.ring); });
  disasterObjs = [];
  const disasters = APP.disasters || [];
  disasters.forEach(d => {
    if (!d.lat || !d.lon) return;
    const col = d.severity === 'critical' ? 0xff2244
              : d.severity === 'high'     ? 0xff6600
              :                             0xffaa00;

    // Icon sphere
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 8, 8),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })
    );
    const pos = ll2v(d.lat, d.lon, R + 4.5);
    mesh.position.copy(pos);
    mesh.visible = L.disasters;
    mesh.userData.disasterData = d;
    globeGroup.add(mesh);

    // Rotating ring (bigger than conflict rings — disasters are visible from afar)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 4.0, 24),
      new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.45,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    ring.position.copy(pos);
    ring.lookAt(0, 0, 0); ring.rotateX(Math.PI / 2);
    ring.visible = L.disasters;
    globeGroup.add(ring);

    disasterObjs.push({ mesh, ring, data: d, phase: Math.random() * Math.PI * 2 });
  });
}

// ─────────────────────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────────────────────
let lastT=performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now=performance.now(), dt=(now-lastT)/1000; lastT=now; simTime+=dt;

  if (!isDragging) {
    globeGroup.rotation.y+=rotVelY; rotVelY*=0.97; rotVelX*=0.97;
  }

  // Clouds slowly drift eastward
  if (cloudMesh) cloudMesh.rotation.y+=0.00010;

  // Night side: update based on sun-globe angle (rough approximation)
  // The night lights should only show on the dark hemisphere
  // We do this by setting opacity based on surface normal vs sun direction
  // Simple approach: keep night mesh always showing but at reduced opacity
  // (full atmospheric lighting handles dark side naturally via the directional light)

  updateSatPositions();

  // Ocean current particles
  particleSystems.forEach(ps=>{
    ps.offsets=ps.offsets.map(o=>(o+ps.speed)%1.0);
    const pos=ps.pts.geometry.attributes.position;
    ps.offsets.forEach((o,i)=>{const p=lerp3WPts(ps.wpts,o),v=ll2v(p.lat,p.lon,R+0.8);pos.setXYZ(i,v.x,v.y,v.z);});
    pos.needsUpdate=true;
  });

  // Conflict rings pulse
  conflictObjs.forEach(co=>{
    if(!co.ring) return;
    co.phase=(co.phase||0)+0.045;
    co.ring.material.opacity=0.2+0.35*Math.sin(co.phase);
    const s=1+0.18*Math.sin(co.phase); co.ring.scale.set(s,s,s);
  });

  // Cyber beams pulse
  cyberBeams.forEach(b=>{
    b.phase=(b.phase||0)+b.pulseSpeed*dt;
    b.line.material.opacity=Math.max(0,Math.sin(b.phase)*0.7);
  });

  // Disaster rings pulse (faster than conflict rings)
  disasterObjs.forEach(o => {
    if (!o.ring) return;
    o.phase = (o.phase || 0) + 0.06;
    o.ring.material.opacity = 0.25 + 0.30 * Math.sin(o.phase);
    const s = 1 + 0.25 * Math.sin(o.phase);
    o.ring.scale.set(s, s, s);
  });

  // Weather marker gentle pulse
  weatherObjs.forEach(o => {
    o.phase = (o.phase || 0) + 0.03;
    if (o.mesh.material) {
      const severe = o.data.severity === 'critical' || o.data.severity === 'high';
      o.mesh.material.opacity = severe ? 0.7 + 0.3 * Math.sin(o.phase * 2) : 0.85;
    }
  });

  // Fire flicker
  globeGroup.traverse(c=>{
    if(c.userData.isFire&&c.userData.baseOpacity){
      c.userData.phase=(c.userData.phase||0)+0.08;
      c.material.opacity=c.userData.baseOpacity*(0.7+0.3*Math.sin(c.userData.phase));
    }
    if(c.userData.isHeatmap){
      c.userData.phase=(c.userData.phase||0)+(c.userData.speed||0.004);
      c.material.opacity=0.04+0.02*Math.sin(c.userData.phase);
    }
  });

  // Lightning
  lightningTimer+=dt;
  if(lightningTimer>4+Math.random()*6){ lightningTimer=0; triggerLightning(); }

  renderer.render(scene,camera);
}

function updateStatusTicker() {
  const el=document.getElementById('sb-ticker'); if(!el||!APP.news.length) return;
  const a=APP.news[Math.floor(Math.random()*Math.min(APP.news.length,10))];
  el.textContent=`⬡ ${a.source}: ${a.headline.slice(0,90)}${a.headline.length>90?'...':''}`;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC INIT + EVENTS
// ─────────────────────────────────────────────────────────────
window.initGlobe = function() {
  if (!APP.satellites) APP.satellites = FALLBACK_SATS;
  if (!APP.ships)      APP.ships = [];

  initScene();
  renderConflictList();
  renderFlightList();
  renderNewsList();
  updateTicker();
};

window.addEventListener('flightsUpdate',  ()=>{ if(APP.currentPage==='globe'){addFlights();renderFlightList();} });
window.addEventListener('newsUpdate',     ()=>{ if(APP.currentPage==='globe'){renderNewsList();updateTicker();} });
window.addEventListener('alertUpdate',    ()=>{ if(APP.currentPage==='globe') renderConflictList(); });
window.addEventListener('shipsUpdate',    ()=>{ if(APP.currentPage==='globe') addShips(); });
window.addEventListener('firesUpdate',    ()=>{ if(APP.currentPage==='globe') buildWildfireMarkers(); });
window.addEventListener('weatherUpdate',  ()=>{ if(APP.currentPage==='globe'){ buildWeatherMarkers(); buildDisasterMarkers(); } });
window.addEventListener('satsUpdate',     ()=>{
  if(APP.satPositions&&APP.satPositions.length>0&&Object.keys(satObjs).length>0){
    APP.satPositions.forEach(sp=>{const o=satObjs[sp.id]; if(o) o.mesh.position.set(sp.x,sp.y,sp.z);});
  }
});
window.addEventListener('pageChange', e=>{
  if(e.detail.pageId!=='globe') return;
  renderConflictList(); renderFlightList(); renderNewsList(); updateTicker();
});

setInterval(updateStatusTicker, 8000);
})();
