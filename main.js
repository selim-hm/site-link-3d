import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

console.clear();

class MapWithFogOfWar extends THREE.Group{
  constructor(){
    super();
    
    let terrainG = new THREE.PlaneGeometry(50, 50, 50, 50).rotateX(Math.PI * -0.5);
    let terrainM = new THREE.MeshLambertMaterial({color: "gray"});
    this.add(new THREE.Mesh(terrainG, terrainM));
    
    // objects
    let objAmount = 100;
    let geoms = [
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.SphereGeometry(),
      new THREE.CylinderGeometry().scale(1, 2, 1),
      new THREE.TorusGeometry()
    ]
    for(let i = 0; i < objAmount; i++){
      let objG = geoms[Math.floor(Math.random() * geoms.length)];
      let objM = new THREE.MeshLambertMaterial({color: new THREE.Color().setHSL(Math.random(), 0.75, 0.75)});
      let obj = new THREE.Mesh(objG, objM);
      obj.position.random().subScalar(0.5).multiplyScalar(50).setY(2);
      obj.rotation.set(Math.random() * Math.PI * 2,Math.random() * Math.PI * 2,Math.random() * Math.PI * 2);
      this.add(obj);
    }
    
    this.add(new THREE.Mesh(new THREE.SphereGeometry(500), new THREE.MeshLambertMaterial({side: THREE.DoubleSide})));
    
    // fog of war
    let c = document.createElement("canvas");
    let ctx = c.getContext("2d");
    c.width = c.height = 25;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(25, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    for(let i = 0; i < 25; i++){  
      ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 5, 5);
    }
    let fogTexture = new THREE.CanvasTexture(c);
    
    this.uniforms = {
      fogTexture: {value: fogTexture}
    };
    
    this.children.forEach(child => {
      child.receiveShadow = true;
      child.castShadow = true;
      child.material.onBeforeCompile = shader => {
        shader.uniforms.time = gu.time;
        shader.uniforms.aspect = gu.aspect;
        shader.uniforms.fogTexture = this.uniforms.fogTexture;
        shader.vertexShader = `
          varying vec2 fogUV;
          varying vec4 vWPos;
          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
          
          vec4 wPos = modelMatrix * vec4(position, 1.);
          vWPos = projectionMatrix * viewMatrix * wPos;
          fogUV = vec2(wPos.x + 25., 25. - wPos.z) / 50.;
          
          `
        );
        //console.log(shader.vertexShader);
        shader.fragmentShader = `
          uniform float time;
          uniform float aspect;
          uniform sampler2D fogTexture;
          varying vec4 vWPos;
          varying vec2 fogUV;
          ${shader.fragmentShader}
        `.replace(
          `#include <tonemapping_fragment>`,
          `
          
          vec2 fogUVabs = abs(fogUV - 0.5);
          float fogUVlim = 1. - step(0.5, max(fogUVabs.x, fogUVabs.y));
          float fogF = texture(fogTexture, fogUV).r;
          fogF *= fogUVlim;
          
          // star field
          
          vec2 starField = (vWPos.xy / vWPos.w) * vec2(aspect, 1.);
          starField *= 10.;
          
          vec2 starID = floor(starField);
          vec2 starUV = (fract(starField) - 0.5) * 2.;

          float noStar = 1. - step(0.5, rand(starID));
          float starSize = (sin(mod(rand(starID) * 100. + time * 5., PI2)) * 0.5 + 0.5) * 2. + 1.;
          
          starUV *= starSize;
          vec2 starUVabs = abs(starUV);
          
          float starUVlim = 1. - step(0.5, max(starUVabs.x, starUVabs.y));
          vec2 fw = fwidth(starField);
          float ffw = min(fw.x, fw.y);
          float starF = smoothstep(0.5, 0.5 + ffw, length(abs(starUVabs - 0.5)));
          starF *= starUVlim * noStar;
          
          vec3 col = vec3(1, 0.75, 0.75) * starF;
          
          gl_FragColor.rgb = mix(col, gl_FragColor.rgb, fogF);
          
          
          
          #include <tonemapping_fragment>`
        );
        //console.log(shader.fragmentShader);
      }
    })
  }
}

let gu = {
  time: {
    value: 0    
  },
  aspect: {
    value: innerWidth / innerHeight
  }
};
let dpr = Math.min(devicePixelRatio, 1);
let scene = new THREE.Scene();
//scene.background = new THREE.Color(0x444444);
let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 1000);
camera.position.set(0, 1, 1).setLength(20);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth * dpr, innerHeight * dpr);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (event) => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth * dpr, innerHeight * dpr);
  gu.aspect.value = camera.aspect;
});

let camShift = new THREE.Vector3(0, 5, 0);
camera.position.add(camShift);
let controls = new OrbitControls(camera, renderer.domElement);
controls.target.add(camShift);
controls.enableDamping = true;

let light = new THREE.DirectionalLight(0xffffff, Math.PI);
let camSize = 100;
light.shadow.camera.top = camSize;
light.shadow.camera.bottom = -camSize;
light.shadow.camera.left = -camSize;
light.shadow.camera.right = camSize;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.castShadow = true;
light.position.set(0.5, 1, 1).setLength(50);
scene.add(light, new THREE.AmbientLight(0xffffff, Math.PI * 0.1));

let shadowHelper = new THREE.CameraHelper(light.shadow.camera);
//scene.add(shadowHelper);

// stuff

let mapWithFogOfWar = new MapWithFogOfWar();
scene.add(mapWithFogOfWar);

////////

let clock = new THREE.Clock();
let t = 0;

renderer.setAnimationLoop(() => {
  let dt = clock.getDelta();
  t += dt;
  gu.time.value = t;
  controls.update();
  renderer.render(scene, camera);
});
const cursor = document.getElementById("cursor");
const cursorPt = document.getElementById("cursorPt");
const target = document.getElementById("target");

const CURSOR_WIDTH = cursor.getBoundingClientRect().width;
const CURSOR_PT_WIDTH = cursorPt.getBoundingClientRect().width;

let isOverTarget = false;
let rotationTween;
let exitTween = null;
let enterTween = null;

// Initial rotation loop using GSAP
function startRotation() {
  gsap.set(cursor, { rotation: 0 });
  rotationTween = gsap.to(cursor, {
    rotation: 180,
    duration: 1.2,
    repeat: -1,
    ease: "linear",
    transformOrigin: "center center"
  });
}

function stopRotation() {
  if (rotationTween) rotationTween.kill();
}

document.addEventListener("mousemove", (e) => {
  gsap.to(cursor, {autoAlpha: 1});
    gsap.to(cursorPt, {autoAlpha: 1});
  if (!isOverTarget) {
    gsap.to(cursor, {
      x: e.clientX - CURSOR_WIDTH / 2,
      y: e.clientY - CURSOR_WIDTH / 2,
      duration: 0.1,
      ease: "expo.out"
    });
  }
  gsap.to(cursorPt, {
    x: e.clientX - CURSOR_PT_WIDTH/2,
    y: e.clientY- CURSOR_PT_WIDTH/2,
    duration: 0.1,
    ease: "expo.out"
  });
});

target.addEventListener("mouseenter", () => {
  isOverTarget = true;
  stopRotation();

  const rect = target.getBoundingClientRect();
  
  if (exitTween) exitTween.kill();
  enterTween = gsap.to(cursor, {
    width: rect.width,
    height: rect.height,
    borderColor: "red",
    rotation: 360,
    duration: 0.2,
    ease: "easeOut"
  });
});

// Move within target
target.addEventListener("mousemove", (e) => {
  const rect = target.getBoundingClientRect();

  const targetWidth = rect.width;
  const targetHeight = rect.height;

  // center
  const cx = rect.left + targetWidth / 2;
  const cy = rect.top + targetHeight / 2;

  // distance from center
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;

  gsap.to(cursor, {
    x: rect.left + dx * 0.09,
    y: rect.top + dy * 0.09,
    scale: 1.1,
    duration: 0.1,
    ease: "power2.out"
  });
});

// Leave target
target.addEventListener("mouseleave", () => {
  isOverTarget = false;
  
  exitTween = gsap.to(cursor, {
    width: 30,
    height: 30,
    duration: 0.5,
    ease: "elastic.out(1, .9)"
  });

  startRotation();
});

startRotation();
