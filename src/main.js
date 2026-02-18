import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

//  1. Scene Setup 
const canvas = document.querySelector("#experience-canvas")
const sizes = { width: window.innerWidth, height: window.innerHeight }
const scene = new THREE.Scene();

//  2. Loaders 
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('draco/'); 
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

//  3. Configuration 
const socialLinks = {
  github: "https://github.com/ChungYuEricson",
  linkedin: "https://www.linkedin.com/in/ericson-ho-28b85a265/"
};

const textureMap = {
  backdrop: "textures/room/backdrop.webp",
  room: "textures/room/background.001.webp",
  github: "textures/room/Poster.001.webp",
  linkedin: "textures/room/Poster.001.webp",
  chair: "textures/room/chair2.webp",
  table: "textures/room/drawerlamptable.webp",
  headset: "textures/room/headset.webp",
  deskobjects: "textures/room/deskobjects.webp"
};

const loadedTextures = {};
Object.entries(textureMap).forEach(([key, path]) => {
  const texture = textureLoader.load(path);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  loadedTextures[key] = new THREE.MeshBasicMaterial({ 
    map: texture,
    color: new THREE.Color(1.2, 1.2, 1.2) 
  })
});

//  4. Rectangular Drop-Shadow Generator 
const createShadow = () => {
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 256; 
  const context = shadowCanvas.getContext('2d');

  context.fillStyle = 'rgba(0, 0, 0, 0.22)'; 
  context.filter = 'blur(10px)'; 
  context.fillRect(30, 40, 68, 176);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(0.5, 1); 
  const shadowMat = new THREE.MeshBasicMaterial({ 
    map: shadowTexture, 
    transparent: true, 
    opacity: 0, 
    depthWrite: false, 
    side: THREE.DoubleSide
  });

  return new THREE.Mesh(shadowGeo, shadowMat);
};

//  5. Load Model & Animations 
const clickableObjects = [];
const glassMaterial = new THREE.MeshPhysicalMaterial({ 
  transmission: 1, thickness: 0.5, roughness: 0.05, transparent: true 
});

loader.load('models/profile.glb', (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      const textureKey = Object.keys(loadedTextures).find(key => key.toLowerCase() === child.name.toLowerCase());
      if (textureKey) { 
        child.material = loadedTextures[textureKey]; 
      } else if (child.name.includes("Glass")) { 
        child.material = glassMaterial; 
      }

      const name = child.name.toLowerCase();
      if (name.includes("github") || name.includes("linkedin")) {
        clickableObjects.push(child);
        const shadow = createShadow();

        shadow.rotation.y = Math.PI / 2; 
        if (name.includes("linkedin")) {
          shadow.position.set(child.position.x - 0.001, child.position.y + 0.4, child.position.z - 0.4);
        } else if (name.includes("github")) {
          shadow.position.set(child.position.x - 0.001, child.position.y + 0.4, child.position.z - 2.5);
        }
        
        shadow.scale.set(0, 0, 0); 
        scene.add(shadow);

        const originalScale = child.scale.clone();
        child.userData.originalScale = originalScale;
        child.userData.shadow = shadow;

        child.scale.set(0, 0, 0);
        const delay = name.includes("github") ? 0.2 : 0.6;
        
        gsap.to(child.scale, { 
          x: originalScale.x, y: originalScale.y, z: originalScale.z, 
          duration: 1.2, delay, ease: "back.out(1.7)" 
        });

        gsap.to(shadow.scale, { 
          x: originalScale.z * 1.4, y: originalScale.y * 0.8, z: 1, 
          duration: 1.2, delay, ease: "back.out(1.7)" 
        });

        gsap.to(shadow.material, { 
          opacity: 1, duration: 1, delay: delay + 0.2 
        });
      }
    }
  });
  scene.add(gltf.scene);

  const tl = gsap.timeline();
  tl.to(camera.position, { 
    x: 13.88, 
    y: 2.88, 
    z: 7.68, 
    duration: 3, 
    ease: "power2.inOut", 
    onUpdate: () => controls.update() 
  });

  tl.to("#ui-widget", { opacity: 1, duration: 0.3 }, "-=0.5"); 
  tl.to("#ui-widget", { height: "260px", duration: 1.5, ease: "expo.out" });
});

//  6. Camera, Renderer, Controls 
const camera = new THREE.PerspectiveCamera(28, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(8.29, 13.54, 19.49); 

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableRotate = false;
controls.enableZoom = false;   
controls.enablePan = false;

controls.target.set(-1.34, 2.39, -2.09); 
controls.update();

//  7. Interactivity 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    if (hoveredObject !== intersects[0].object) {
      hoveredObject = intersects[0].object;
      canvas.style.cursor = 'pointer';
      
      const s = hoveredObject.userData.originalScale;
      gsap.to(hoveredObject.scale, { x: s.x * 1.05, y: s.y * 1.05, z: s.z * 1.05, duration: 0.3 });
      gsap.to(hoveredObject.userData.shadow.scale, { x: s.z * 1.45, y: s.y * 0.85, duration: 0.3 });
    }
  } else if (hoveredObject) {
    const s = hoveredObject.userData.originalScale;
    gsap.to(hoveredObject.scale, { x: s.x, y: s.y, z: s.z, duration: 0.3 });
    gsap.to(hoveredObject.userData.shadow.scale, { x: s.z * 1.4, y: s.y * 0.8, duration: 0.3 });
    hoveredObject = null;
    canvas.style.cursor = 'default';
  }
});

window.addEventListener('click', () => {
  if (hoveredObject) {
    const link = hoveredObject.name.toLowerCase().includes("github") ? socialLinks.github : socialLinks.linkedin;
    window.open(link, '_blank');
  }
});

//  8. Animation Loop 
const render = () => { 
  controls.update(); 
  renderer.render(scene, camera); 
  window.requestAnimationFrame(render); 
}
render();

//  9. Resize 
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth; 
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height; 
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});