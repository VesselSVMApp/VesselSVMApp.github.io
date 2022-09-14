var userInput = prompt("Input your IP Address" + "");
let ws_address_list = [];
ws_address_list.push("ws://" + userInput + ":30001");
ws_address_list.push("ws://" + userInput + ":30002");
ws_address_list.push("ws://" + userInput + ":30003");
ws_address_list.push("ws://" + userInput + ":30004");

function reset_IP_List(input) {
  ws_address_list[0] = "ws://" + userInput + ":30001";
  ws_address_list[1] = "ws://" + userInput + ":30002";
  ws_address_list[2] = "ws://" + userInput + ":30003";
  ws_address_list[3] = "ws://" + userInput + ":30004";
  return ws_address_list;
}

import * as THREE from "three";
import { OrbitControls } from "./OrbitControls.js";
import { Water } from "./Water.js";
import { Sky } from "./Sky.js";
import { GLTFLoader } from "./GLTFLoader.js";

let video = document.getElementById("video");
let context = video.getContext("2d");

let video_2 = document.getElementById("video_2");
let context_2 = video_2.getContext("2d");

let video_3 = document.getElementById("video_3");
let context_3 = video_3.getContext("2d");

let video_4 = document.getElementById("video_4");
let context_4 = video_4.getContext("2d");

let camera, scene, renderer;
let controls, water, sun;

init();

waitError();

const mesh = createCamMesh(video, 0, 30, -40);
mesh.rotateX(-1.57);
const mesh_2 = createCamMesh(video_2, 50, 30, 0);
mesh_2.rotateX(-1.57).rotateZ(-1.57);
const mesh_3 = createCamMesh(video_3, -65, 30, 0);
mesh_3.rotateX(-1.57).rotateZ(-1.57);
const mesh_4 = createCamMesh(video_4, 0, 30, 45);
mesh_4.rotateX(-1.57).rotateZ(3.14);
animate();

function Set_jsmpeg(ws_address, video) {
  const client = new WebSocket(ws_address);
  const player = new jsmpeg(client, {
    canvas: video,
  });
}

async function waitError() {
  const client = new WebSocket(ws_address_list[0]);
  client.onerror = function (e) {
    console.log(e);
    userInput = prompt("Input proper IP Address" + "");
    ws_address_list = reset_IP_List(userInput);
    Set_jsmpeg(ws_address_list[0], video);
    Set_jsmpeg(ws_address_list[1], video_2);
    Set_jsmpeg(ws_address_list[2], video_3);
    Set_jsmpeg(ws_address_list[3], video_4);
    waitError();
  };
  client.onopen = function (e) {
    Set_jsmpeg(ws_address_list[0], video);
    Set_jsmpeg(ws_address_list[1], video_2);
    Set_jsmpeg(ws_address_list[2], video_3);
    Set_jsmpeg(ws_address_list[3], video_4);
  };
}
function createCamMesh(canvas, x, y, z) {
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(0, 0, 480, 640);

  const video_texture = new THREE.DataTexture(
    imageData.data,
    imageData.width,
    imageData.height,
    THREE.RGBAFormat
  );
  video_texture.flipY = true;
  video_texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    map: video_texture,
  });
  const geometry = new THREE.PlaneGeometry(50, 50, 50);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.material.needsUpdate = true;
  mesh.material.map.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

function updateDataTexture(canvas, mesh) {
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(0, 0, 480, 640);

  mesh.material.map.needsUpdate = true;
  mesh.material.map.source.data.data = imageData.data;
}

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(30, 30, 100);

  sun = new THREE.Vector3();
  // Water
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "./waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });

  water.rotation.x = -Math.PI / 2;

  scene.add(water);

  // Skybox
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;

  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = {
    elevation: 25,
    azimuth: 180,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;
  }

  updateSun();

  // boat
  const loader = new GLTFLoader();
  loader.load("./motorboat.glb", function (gltf) {
    const model = gltf.scene;
    scene.add(model);
    model.scale.set(0.1, 0.1, 0.1);
    model.position.set(0, -2, 0);
  });

  // control
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  const time = performance.now() * 0.001;

  updateDataTexture(video, mesh);
  updateDataTexture(video_2, mesh_2);
  updateDataTexture(video_3, mesh_3);
  updateDataTexture(video_4, mesh_4);
  water.material.uniforms["time"].value += 1.0 / 60.0;

  renderer.render(scene, camera);
}

// Check imageData when Click

/*
var t = document.getElementById("target");
t.addEventListener("click", function (event) {
  imagedata_to_image(imageData);
});

function imagedata_to_image(imagedata) {
  console.log(imagedata);
  console.log(video_texture);
  console.log(mesh2.material);
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = imagedata.width;
  canvas.height = imagedata.height;
  ctx.putImageData(imagedata, 0, 0);

  var image = new Image();
  image.src = canvas.toDataURL("./");
  return image;
}*/
