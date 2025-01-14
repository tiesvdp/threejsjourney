import * as THREE from 'three';
import "./style.css";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import { MaskPass, ClearMaskPass } from 'three/examples/jsm/postprocessing/MaskPass';

// scene: the "world" where the 3D objects live
const scene = new THREE.Scene();
const bloomScene = new THREE.Scene();

// geometry: the "shape" of the 3D object
const geometry = new THREE.SphereGeometry(3, 64, 64);

// material: the "skin" of the 3D object
const material = new THREE.MeshStandardMaterial({
  color: "#00ff83",
  roughness: 0.46,
});

const sphere = new THREE.Mesh(geometry, material);
sphere.castShadow = true;
scene.add(sphere);
const bloomSphere = sphere.clone();
bloomScene.add(bloomSphere); // Add a clone of the sphere to the bloom scene

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// camera: the "eye" that views the 3D objects
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0, 25); // Adjust the camera to fit both the sphere and the plane
scene.add(camera);
bloomScene.add(camera.clone()); // Add a clone of the camera to the bloom scene

// light: the "sun" that illuminates the 3D objects
const light = new THREE.PointLight(0xffffff, 225, 100);
light.position.set(0, 10, 10);
light.castShadow = true; // Enable shadows from the light
scene.add(light);
bloomScene.add(light.clone()); // Add a clone of the light to the bloom scene

// renderer: the "painter" that renders the 3D objects
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true; // Enable shadow maps for realistic lighting
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows for smooth visuals
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

// Create an EffectComposer for the bloom effect
const bloomComposer = new EffectComposer(renderer);
const renderScene = new RenderPass(bloomScene, camera);
bloomComposer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  1.2, // strength
  0.5, // radius
  0.6 // threshold
);
bloomComposer.addPass(bloomPass);

const finalPass = new ShaderPass(CopyShader);
finalPass.renderToScreen = true;
bloomComposer.addPass(finalPass);

// Create a second EffectComposer for the final render
const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(new RenderPass(scene, camera));

// controls: the "mouse" that moves the 3D objects
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 3;

// Resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});

// loop to always render the scene correctly
const loop = () => {
  controls.update();
  renderer.autoClear = false;
  renderer.clear();
  finalComposer.render();
  bloomComposer.render();
  window.requestAnimationFrame(loop);
};
loop();

// Timeline stuff with GSAP: synchronize animations together
const tl = gsap.timeline({ defaults: { duration: 1 } });
tl.fromTo(sphere.scale, { z: 0, x: 0, y: 0 }, { z: 1, x: 1, y: 1 });
tl.fromTo('nav', { y: "-100%" }, { y: 0 });
tl.fromTo('.title', { opacity: 0 }, { opacity: 1 });

// Mouse animation color
let mouseDown = false;
let rgb = [];
window.addEventListener('mousedown', () => {
  mouseDown = true;
});
window.addEventListener('mouseup', () => {
  mouseDown = false;
});
window.addEventListener('mousemove', (event) => {
  if (mouseDown) {
    rgb = [
      Math.round((event.pageX / sizes.width) * 255),
      Math.round((event.pageY / sizes.height) * 255),
      150
    ];
    gsap.to(sphere.material.color, new THREE.Color(`rgb(${rgb.join(",")})`));
    // Update the bloom sphere color as well
    bloomSphere.material.color.set(`rgb(${rgb.join(",")})`);
  }
});