/* ============================================================================
   AMIT CHOUHAN — hero3d.js  (ES module)
   Extruded 3D "AMIT" wordmark — neubrutalism: solid MINT faces, dead-BLACK
   extrude depth + black edge outline, transparent canvas (cream shows through).

   - Mouse tilt with lerp smoothing (desktop). Gentle auto-rotate on touch.
   - pixelRatio capped at 2; render loop paused offscreen (IntersectionObserver);
     lower geometry detail on small screens.
   - Fully guarded: any failure leaves the CSS wordmark fallback in place.
   - Respects prefers-reduced-motion (skips WebGL entirely → static fallback).
   ========================================================================== */
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/fonts/helvetiker_bold.typeface.json';

(function initHero3D() {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.getElementById('top');
  if (!canvas || !hero) return;

  // Reduced motion → keep the static CSS wordmark, never spin up WebGL.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Mobile/small screens: lighter geometry, no AA, lower DPR.
  const small = window.innerWidth < 700;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small });
  } catch (e) {
    console.warn('[hero3d] WebGL unavailable, using CSS fallback:', e && e.message);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 8;

  // Lighting: high ambient (flat, brutalist) + soft key/fill to read the depth.
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 0.55); key.position.set(-3, 4, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.25); fill.position.set(4, -2, 3); scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  const faceMat = new THREE.MeshStandardMaterial({ color: 0x7FEFBD, roughness: 0.5, metalness: 0.0 }); // mint caps
  const sideMat = new THREE.MeshBasicMaterial({ color: 0x000000 });                                    // dead-black walls

  let textMesh = null, textW = 1, textH = 1;
  let running = false, raf = null;

  // ---- interaction -------------------------------------------------------
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let pX = 0, pY = 0;
  if (canHover) {
    window.addEventListener('pointermove', (e) => {
      pX = (e.clientX / window.innerWidth) - 0.5;
      pY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });
  }

  // ---- fit + resize (text always fits the canvas → never overflows) ------
  function fit() {
    if (!textMesh) return;
    const vH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z;
    const vW = vH * camera.aspect;
    const scale = Math.min((vW * 0.80) / textW, (vH * 0.70) / textH);
    group.scale.setScalar(scale);
  }
  function resize() {
    const w = canvas.clientWidth || canvas.offsetWidth || 1;
    const h = canvas.clientHeight || canvas.offsetHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    fit();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- render loop -------------------------------------------------------
  function frame(t) {
    raf = requestAnimationFrame(frame);
    let ry, rx;
    if (canHover) { ry = pX * 0.5; rx = pY * 0.32; }
    else { ry = Math.sin(t * 0.0005) * 0.4; rx = 0.05; }     // touch: gentle auto-rotate
    ry = Math.max(-0.5, Math.min(0.5, ry));
    rx = Math.max(-0.35, Math.min(0.35, rx));
    group.rotation.y += (ry - group.rotation.y) * 0.06;       // lerp smoothing
    group.rotation.x += (rx - group.rotation.x) * 0.06;
    renderer.render(scene, camera);
  }
  function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  // Pause when hero scrolls offscreen, and when the tab is hidden.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { es[0].isIntersecting ? start() : stop(); }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  // ---- build the text ----------------------------------------------------
  new FontLoader().load(
    FONT_URL,
    (font) => {
      try {
        const geo = new TextGeometry('AMIT', {
          font,
          size: 2,
          depth: small ? 0.45 : 0.6,
          curveSegments: small ? 4 : 8,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.035,
          bevelOffset: 0,
          bevelSegments: small ? 1 : 2
        });
        geo.center();
        geo.computeBoundingBox();
        textW = geo.boundingBox.max.x - geo.boundingBox.min.x;
        textH = geo.boundingBox.max.y - geo.boundingBox.min.y;

        textMesh = new THREE.Mesh(geo, [faceMat, sideMat]); // [caps, walls]
        // Crisp black outline along the letter contours.
        textMesh.add(new THREE.LineSegments(
          new THREE.EdgesGeometry(geo, 30),
          new THREE.LineBasicMaterial({ color: 0x000000 })
        ));
        group.add(textMesh);

        fit();
        hero.classList.add('is-3d-ready'); // fade out the CSS fallback
        start();
      } catch (err) {
        console.warn('[hero3d] geometry build failed, using CSS fallback:', err && err.message);
      }
    },
    undefined,
    (err) => console.warn('[hero3d] font failed to load, using CSS fallback:', err && err.message)
  );
})();
