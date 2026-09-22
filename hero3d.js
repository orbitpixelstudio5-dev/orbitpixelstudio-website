import * as THREE from 'three';

/**
 * Mission-control HUD scene for the Orbit Pixel Studio hero: a wireframe
 * tracking-globe with three satellites orbiting it (one per service),
 * reacting gently to cursor position and scroll. Progressive enhancement —
 * if this fails or WebGL is unavailable, the CSS/SVG ring fallback in the
 * hero stays visible untouched; see the .has-3d toggle in styles.css.
 */
(function initHero3D(){
  var canvas = document.getElementById('heroCanvas3d');
  var heroEl = document.querySelector('.hero.hero--cinematic');
  if (!canvas || !heroEl) return; // only the homepage ships this canvas

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    return; // no WebGL — CSS/SVG fallback stays visible
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  var camHome = { x: 0, y: -0.1, z: 8.4 };
  camera.position.set(camHome.x, camHome.y, camHome.z);

  var anchor = new THREE.Group();
  anchor.position.set(0, -1.1, -1.2); // sits low/behind, so the headline reads clearly above it
  scene.add(anchor);

  // Tracking globe — a dim wireframe sphere plus a faint solid core for depth
  var globeGeo = new THREE.SphereGeometry(1.65, 22, 14);
  var globe = new THREE.LineSegments(
    new THREE.WireframeGeometry(globeGeo),
    new THREE.LineBasicMaterial({ color: 0x5a5a72, transparent: true, opacity: 0.4 })
  );
  anchor.add(globe);

  var globeCore = new THREE.Mesh(
    globeGeo,
    new THREE.MeshBasicMaterial({ color: 0x0c0c12, transparent: true, opacity: 0.55 })
  );
  anchor.add(globeCore);

  // Three tilted orbit rings — purple (website), blue (social), orange (leads) — each with one satellite
  var ringColors = [0x8b5cf6, 0x4f8eff, 0xff7a45];
  var ringRadii = [2.15, 2.55, 2.95];
  var rings = [], satellites = [];
  ringColors.forEach(function(color, i){
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadii[i], 0.008, 12, 120),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.45 })
    );
    ring.rotation.x = Math.PI / 2.25 + i * 0.4;
    ring.rotation.y = i * 0.7;
    anchor.add(ring);
    rings.push(ring);

    var sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 14, 14),
      new THREE.MeshBasicMaterial({ color: color })
    );
    ring.add(sat); // child of the ring so it inherits the ring's tilt automatically
    satellites.push(sat);
  });

  // Sparse starfield for depth
  var starCount = 260;
  var starPos = new Float32Array(starCount * 3);
  for (var i = 0; i < starCount; i++){
    starPos[i * 3] = (Math.random() - 0.5) * 20;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 9 - 2;
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.016, transparent: true, opacity: 0.4, sizeAttenuation: true
  }));
  scene.add(stars);

  // Lights (mainly for the satellites; the wireframe/lines are unlit by design)
  scene.add(new THREE.AmbientLight(0x40405a, 1.1));
  var l1 = new THREE.PointLight(0x8b5cf6, 4, 14); l1.position.set(-2, 2, 4); scene.add(l1);
  var l2 = new THREE.PointLight(0x4f8eff, 3, 14); l2.position.set(4, -1, 3); scene.add(l2);

  function resize(){
    var rect = heroEl.getBoundingClientRect();
    var w = Math.max(rect.width, 1), h = Math.max(rect.height, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  var startTime = performance.now(); // own timer: THREE.Clock is deprecated in recent three.js releases
  var mx = 0, my = 0; // smoothed cursor position

  function render(){
    var t = (performance.now() - startTime) / 1000;
    var progress = window.__heroProgress || 0;
    var targetX = window.__heroMouseX || 0;
    var targetY = window.__heroMouseY || 0;

    // Smooth (lerp) toward the live cursor target so movement feels fluid, not jumpy
    mx += (targetX - mx) * 0.04;
    my += (targetY - my) * 0.04;

    anchor.rotation.y = t * 0.035 + progress * 0.35 + mx * 0.18;
    anchor.rotation.x = my * -0.1;

    rings.forEach(function(ring, i){
      ring.rotation.z += 0.0016 * (i % 2 === 0 ? 1 : -1) * (i + 1);
    });

    satellites.forEach(function(sat, i){
      var speed = 0.22 + i * 0.07;
      var a = t * speed;
      var r = ringRadii[i];
      sat.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    });

    stars.rotation.y = t * 0.005;

    camera.position.x = camHome.x + mx * 0.4;
    camera.position.y = camHome.y - my * 0.25 + progress * 0.3;
    camera.lookAt(anchor.position);

    renderer.render(scene, camera);
  }

  if (prefersReduced){
    render(); // one static frame, no continuous animation
  } else {
    (function tick(){
      requestAnimationFrame(tick);
      render();
    })();
  }

  heroEl.classList.add('has-3d');
})();
