/* ============================================================
   HeroScene.js — the hero centerpiece.

   An iridescent, faceted metal crystal reflecting a procedurally
   generated studio environment, wrapped in a slow-rotating
   wireframe and a soft particle field, lit with electric blue &
   purple accents.

   Performance:
   • geometry detail, particle count and pixel-ratio all scale
     with the device tier (see utils/env.js);
   • the render loop only runs while the hero is on-screen AND the
     tab is visible (IntersectionObserver + visibilitychange);
   • under prefers-reduced-motion it renders a single static frame;
   • all GPU resources are disposed in destroy().
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { env, pointer, getPerfTier, dprCap, damp } from '../utils/env.js';

/** Soft round sprite used for glowing particles. */
function makeParticleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Large soft radial glow behind the crystal. */
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(130,110,255,0.55)');
  g.addColorStop(0.5, 'rgba(91,140,255,0.18)');
  g.addColorStop(1, 'rgba(91,140,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function createHeroScene(container) {
  if (!container) return { destroy() {} };

  const tier = getPerfTier();
  const animated = !env.reducedMotion;

  /* ---- Renderer (fail gracefully if WebGL is unavailable) ---- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: tier !== 'low',
      alpha: true, // let the CSS background & ambient glow show through
      powerPreference: 'high-performance',
    });
  } catch (e) {
    console.warn('[hero] WebGL unavailable, skipping 3D scene');
    return { destroy() {} };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap()));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  /* ---- Environment map for realistic metal reflections ---- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose?.();

  /* ---- The crystal ---- */
  const group = new THREE.Group();
  scene.add(group);

  const detail = tier === 'low' ? 1 : 2;
  const crystalGeo = new THREE.IcosahedronGeometry(1.4, detail);
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0b16,
    metalness: 0.92,
    roughness: 0.18,
    iridescence: 1,
    iridescenceIOR: 1.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.3,
    flatShading: true, // dramatic faceted highlights
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  group.add(crystal);

  /* ---- Wireframe shell rotating the opposite way ---- */
  const wireGeo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.62, 1));
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x5b8cff,
    transparent: true,
    opacity: 0.16,
  });
  const wireframe = new THREE.LineSegments(wireGeo, wireMat);
  group.add(wireframe);

  /* ---- Backing glow ---- */
  const glowTex = makeGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.9,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(7, 7, 1);
  glow.position.z = -1.5;
  group.add(glow);

  /* ---- Particle field ---- */
  const count = tier === 'low' ? 120 : tier === 'mid' ? 300 : 520;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Random point in a spherical shell around the crystal.
    const r = 2.4 + Math.random() * 3.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleTex = makeParticleTexture();
  const particleMat = new THREE.PointsMaterial({
    size: 0.05,
    map: particleTex,
    color: 0x9db4ff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ---- Lights (envMap does the heavy lifting; these add accents) ---- */
  scene.add(new THREE.AmbientLight(0x404060, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const blue = new THREE.PointLight(0x5b8cff, 40, 30);
  blue.position.set(-4, 2, 3);
  scene.add(blue);
  const purple = new THREE.PointLight(0xa855f7, 35, 30);
  purple.position.set(4, -2, 2);
  scene.add(purple);

  /* ---- Layout: size + place the crystal to the right on wide screens ---- */
  let offsetX = 1.6;
  let targetScale = 1;
  const layout = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (w > 960) {
      offsetX = 1.7;
      targetScale = 1;
    } else if (w > 620) {
      offsetX = 0.9;
      targetScale = 0.85;
    } else {
      offsetX = 0;
      targetScale = 0.72;
    }
  };
  layout();
  group.position.x = offsetX;
  group.scale.setScalar(targetScale);

  /* ---- Animation loop, gated by visibility ---- */
  const clock = new THREE.Clock();
  let raf = 0;
  let onScreen = true;
  let tabVisible = !document.hidden;

  const render = () => {
    const dt = Math.min(clock.getDelta(), 0.05); // clamp after long pauses

    // Slow auto-rotation.
    crystal.rotation.y += dt * 0.16;
    crystal.rotation.x += dt * 0.05;
    wireframe.rotation.y -= dt * 0.1;
    wireframe.rotation.z += dt * 0.04;
    particles.rotation.y += dt * 0.02;

    // Mouse reactivity + parallax (framerate-independent damping).
    const tiltX = pointer.ny * 0.35;
    const tiltY = pointer.nx * 0.5;
    group.rotation.x = damp(group.rotation.x, tiltX, 3, dt);
    group.rotation.y = damp(group.rotation.y, tiltY, 3, dt);
    group.position.x = damp(group.position.x, offsetX + pointer.nx * 0.25, 3, dt);
    group.position.y = damp(group.position.y, pointer.ny * 0.2, 3, dt);
    group.scale.setScalar(damp(group.scale.x, targetScale, 4, dt));

    camera.position.x = damp(camera.position.x, pointer.nx * 0.3, 2.5, dt);
    camera.position.y = damp(camera.position.y, pointer.ny * 0.3, 2.5, dt);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  };

  const start = () => {
    if (!raf && animated && onScreen && tabVisible) {
      clock.getDelta(); // reset delta so we don't jump
      raf = requestAnimationFrame(render);
    }
  };
  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  // Static single frame (covers reduced-motion and initial paint).
  renderer.render(scene, camera);
  if (animated) start();

  /* ---- Observers & listeners ---- */
  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      onScreen ? start() : stop();
    },
    { threshold: 0.01 }
  );
  io.observe(container);

  const onVisibility = () => {
    tabVisible = !document.hidden;
    tabVisible ? start() : stop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const ro = new ResizeObserver(() => {
    layout();
    if (!animated) renderer.render(scene, camera); // keep static frame crisp
  });
  ro.observe(container);

  /* ---- Teardown ---- */
  const destroy = () => {
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    crystalGeo.dispose();
    crystalMat.dispose();
    wireGeo.dispose();
    wireMat.dispose();
    particleGeo.dispose();
    particleMat.dispose();
    particleTex.dispose();
    glowTex.dispose();
    glowMat.dispose();
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { destroy };
}
