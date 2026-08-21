/* ============================================================
   CreativeLab.js — the interactive playground.

   A single InstancedMesh (one draw call) of small metallic
   octahedra that drift gently, spin, are repelled by the cursor
   and burst outward on click, then spring back home. Same
   visibility-gating, tier-scaling and disposal discipline as the
   hero scene.
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { env, getPerfTier, dprCap } from '../utils/env.js';

export function createCreativeLab(container) {
  if (!container) return { destroy() {} };

  const tier = getPerfTier();
  const animated = !env.reducedMotion;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: tier !== 'low',
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    console.warn('[lab] WebGL unavailable, skipping 3D scene');
    return { destroy() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap()));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 9;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose?.();

  scene.add(new THREE.AmbientLight(0x40406a, 0.7));
  const l1 = new THREE.PointLight(0x5b8cff, 60, 40);
  l1.position.set(-6, 5, 6);
  scene.add(l1);
  const l2 = new THREE.PointLight(0xa855f7, 55, 40);
  l2.position.set(6, -4, 6);
  scene.add(l2);

  /* ---- Instances ---- */
  const COUNT = tier === 'low' ? 24 : tier === 'mid' ? 46 : 70;
  const geo = new THREE.IcosahedronGeometry(0.34, 0);
  const mat = new THREE.MeshStandardMaterial({
    metalness: 0.6,
    roughness: 0.25,
    envMapIntensity: 1.1,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  // Visible extent at z=0 so objects fill the frame.
  const spreadX = 7.5;
  const spreadY = 4.2;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const items = [];
  for (let i = 0; i < COUNT; i++) {
    const home = new THREE.Vector3(
      (Math.random() * 2 - 1) * spreadX,
      (Math.random() * 2 - 1) * spreadY,
      (Math.random() * 2 - 1) * 1.5
    );
    items.push({
      home,
      pos: home.clone(),
      vel: new THREE.Vector3(),
      seed: Math.random() * Math.PI * 2,
      spin: 0.2 + Math.random() * 0.6,
      scale: 0.6 + Math.random() * 0.9,
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0),
    });
    // Blend instance colour between blue and purple.
    color.setHSL(0.62 + Math.random() * 0.15, 0.7, 0.6);
    mesh.setColorAt(i, color);
  }
  mesh.instanceColor.needsUpdate = true;

  /* ---- Cursor → world position on the z=0 plane ---- */
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ndc = new THREE.Vector2(-10, -10); // offscreen until pointer moves
  const cursor = new THREE.Vector3(999, 999, 0);
  let pointerActive = false;
  let pulse = 0; // decays over time after a click

  const hint = container.querySelector('[data-lab-hint]');
  let interacted = false;
  const markInteracted = () => {
    if (!interacted && hint) {
      interacted = true;
      hint.style.opacity = '0';
    }
  };

  const setNDC = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    pointerActive = true;
  };
  const onMove = (e) => {
    setNDC(e);
    markInteracted();
  };
  const onLeave = () => {
    pointerActive = false;
    cursor.set(999, 999, 0);
  };
  const onDown = (e) => {
    setNDC(e);
    pulse = 1;
    markInteracted();
  };

  container.addEventListener('pointermove', onMove, { passive: true });
  container.addEventListener('pointerleave', onLeave);
  container.addEventListener('pointerdown', onDown);

  /* ---- Loop ---- */
  const clock = new THREE.Clock();
  let raf = 0;
  let onScreen = true;
  let tabVisible = !document.hidden;
  const tmp = new THREE.Vector3();

  const updateInstances = (dt, t) => {
    if (pointerActive) {
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(plane, cursor);
    }
    pulse = Math.max(0, pulse - dt * 1.6);

    for (let i = 0; i < COUNT; i++) {
      const it = items[i];

      // Gentle idle drift around home.
      const driftX = Math.sin(t * 0.5 + it.seed) * 0.35;
      const driftY = Math.cos(t * 0.4 + it.seed * 1.3) * 0.35;
      tmp.set(it.home.x + driftX, it.home.y + driftY, it.home.z);

      // Spring toward the drifting home target.
      it.vel.x += (tmp.x - it.pos.x) * 2.2 * dt;
      it.vel.y += (tmp.y - it.pos.y) * 2.2 * dt;
      it.vel.z += (tmp.z - it.pos.z) * 2.2 * dt;

      // Cursor repulsion (and click pulse from cursor).
      if (pointerActive || pulse > 0) {
        const dx = it.pos.x - cursor.x;
        const dy = it.pos.y - cursor.y;
        const distSq = dx * dx + dy * dy + 0.001;
        if (distSq < 9) {
          const force = ((1 / distSq) * (2.5 + pulse * 8)) * dt;
          it.vel.x += dx * force;
          it.vel.y += dy * force;
        }
      }

      // Damping + integrate.
      it.vel.multiplyScalar(0.9);
      it.pos.x += it.vel.x;
      it.pos.y += it.vel.y;
      it.pos.z += it.vel.z;

      // Compose matrix.
      dummy.position.copy(it.pos);
      dummy.rotation.set(
        it.rot.x + t * it.spin * 0.3,
        it.rot.y + t * it.spin * 0.4,
        it.rot.z
      );
      dummy.scale.setScalar(it.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  const render = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    updateInstances(dt, t);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  };
  const start = () => {
    if (!raf && animated && onScreen && tabVisible) {
      clock.getDelta();
      raf = requestAnimationFrame(render);
    }
  };
  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const layout = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  layout();

  // Initial static frame (also the only frame under reduced motion).
  updateInstances(0.016, 0);
  renderer.render(scene, camera);
  if (animated) start();

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      onScreen ? start() : stop();
    },
    { threshold: 0.05 }
  );
  io.observe(container);

  const onVisibility = () => {
    tabVisible = !document.hidden;
    tabVisible ? start() : stop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const ro = new ResizeObserver(() => {
    layout();
    if (!animated) renderer.render(scene, camera);
  });
  ro.observe(container);

  const destroy = () => {
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    container.removeEventListener('pointermove', onMove);
    container.removeEventListener('pointerleave', onLeave);
    container.removeEventListener('pointerdown', onDown);
    geo.dispose();
    mat.dispose();
    mesh.dispose();
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { destroy };
}
