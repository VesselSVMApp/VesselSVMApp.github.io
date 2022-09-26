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
import { CalibratedCamera } from "./CalibratedCamera.js";

import { Box_Vertices } from "./box_vertices.js";

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
let camera_front, helper;
// let test_vector = [];

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

  camera.position.set(0, 30, 100);

  const camera_calibrated = new CalibratedCamera(
    529,
    529,
    621,
    367,
    0,
    1280, // WIDTH,
    720, // HEIGHT,
    0.1,
    100
  );
  camera_calibrated.position.set(0, 60, 0);
  // camera_calibrated.rotateX(-0.65);
  scene.add(camera_calibrated);
  console.log(camera_calibrated);
  const helper_cal = new THREE.CameraHelper(camera_calibrated);
  scene.add(helper_cal);

  // front camera
  camera_front = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera_front.updateProjectionMatrix();
  console.log(
    "focal length",
    camera_front.getFocalLength(),
    camera_front.filmGauge
  );
  camera_front.position.set(0, 60, -30);
  camera_front.rotateX(-0.65);
  camera_front.updateProjectionMatrix();
  helper = new THREE.CameraHelper(camera_front);
  scene.add(camera_front);
  console.log(camera_front);
  scene.add(helper);

  // video texture
  const video = document.getElementById("cam0");
  // video.paused (비디오가 멈춰있다면) video.play()
  // play()는 web API HTMLMediaElement 메소드
  if (video.paused) {
    video.play();
  }
  const texture = new THREE.VideoTexture(video);
  // .map : Texture
  // set video texture as color map
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });

  // sphere
  const geometry_sphere = new THREE.SphereGeometry(120, 256, 128);
  const sphere = new THREE.Mesh(
    geometry_sphere,
    new THREE.MeshPhongMaterial({
      color: 0xffff00,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.3,
    })
  );
  sphere.position.set(0, 50, 0);
  sphere.updateMatrixWorld();
  scene.add(sphere);

  const LeftTop_near = new THREE.Vector3(-1, 1, 0.9).unproject(camera_front);
  const RightTop_near = new THREE.Vector3(1, 1, 0.9).unproject(camera_front);
  const LeftBottom_near = new THREE.Vector3(-1, -1, 0.9).unproject(
    camera_front
  );
  const RightBottom_near = new THREE.Vector3(1, -1, 0.9).unproject(
    camera_front
  );
  const geometry = new THREE.PlaneGeometry(50, 50);
  console.log(geometry);
  const nearplane_front_geometry = new THREE.BufferGeometry();
  nearplane_front_geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([
        LeftTop_near.x,
        LeftTop_near.y,
        LeftTop_near.z,
        RightTop_near.x,
        RightTop_near.y,
        RightTop_near.z,
        LeftBottom_near.x,
        LeftBottom_near.y,
        LeftBottom_near.z,
        RightBottom_near.x,
        RightBottom_near.y,
        RightBottom_near.z,
      ]),
      3
    )
  );
  nearplane_front_geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2)
  );
  nearplane_front_geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      2
    )
  );
  nearplane_front_geometry.setIndex(
    new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1)
  );

  const nearplane_front = new THREE.Mesh(
    // geometry,
    nearplane_front_geometry,
    new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
    })
  );
  nearplane_front.position.set(0, 60, -30);
  nearplane_front.rotateX(-0.65);
  nearplane_front.updateMatrixWorld();
  scene.add(nearplane_front);

  const set_indices = new Set(sphere.geometry.index.array);
  const array_indices = Array.from(new Set(sphere.geometry.index.array));
  const map_index2vecuv = new Map();
  const array_vecuv = [];

  const vec_cam = new THREE.Vector3(
    camera_front.position.x,
    camera_front.position.y,
    camera_front.position.z
  );
  // set position, index 생성
  for (
    let i = 0;
    i < sphere.geometry.attributes.position.array.length / 3;
    i++
  ) {
    array_vecuv.push([
      new THREE.Vector3()
        .fromBufferAttribute(sphere.geometry.attributes.position, i)
        .add(sphere.position),
    ]);
    map_index2vecuv.set(array_indices[i], array_vecuv[i]);
  }
  console.log(map_index2vecuv);
  const array_hitting_indices = [];
  const array_hitting_position = [];
  const array_hitting_uv = [];
  for (let i = 0; i < sphere.geometry.index.array.length / 3; i++) {
    const raycaster = new THREE.Raycaster(
      map_index2vecuv.get(sphere.geometry.index.array[i * 3])[0],
      vec_cam
        .clone()
        .sub(map_index2vecuv.get(sphere.geometry.index.array[i * 3])[0])
        .normalize(),
      0,
      map_index2vecuv
        .get(sphere.geometry.index.array[i * 3])[0]
        .distanceTo(vec_cam)
    );
    const raycaster_1 = new THREE.Raycaster(
      map_index2vecuv.get(sphere.geometry.index.array[i * 3 + 1])[0],
      vec_cam
        .clone()
        .sub(map_index2vecuv.get(sphere.geometry.index.array[i * 3 + 1])[0])
        .normalize(),
      0,
      map_index2vecuv
        .get(sphere.geometry.index.array[i * 3 + 1])[0]
        .distanceTo(vec_cam)
    );
    const raycaster_2 = new THREE.Raycaster(
      map_index2vecuv.get(sphere.geometry.index.array[i * 3 + 2])[0],
      vec_cam
        .clone()
        .sub(map_index2vecuv.get(sphere.geometry.index.array[i * 3 + 2])[0])
        .normalize(),
      0,
      map_index2vecuv
        .get(sphere.geometry.index.array[i * 3 + 2])[0]
        .distanceTo(vec_cam)
    );
    const intersects = [];
    intersects.push(raycaster.intersectObject(nearplane_front));
    intersects.push(raycaster_1.intersectObject(nearplane_front));
    intersects.push(raycaster_2.intersectObject(nearplane_front));
    if (
      intersects[0].length == 1 &&
      intersects[1].length == 1 &&
      intersects[2].length == 1
    ) {
      array_hitting_indices.push(sphere.geometry.index.array[i * 3]);
      array_hitting_indices.push(sphere.geometry.index.array[i * 3 + 1]);
      array_hitting_indices.push(sphere.geometry.index.array[i * 3 + 2]);

      map_index2vecuv.get(sphere.geometry.index.array[i * 3])[1] =
        intersects[0][0].uv;
      map_index2vecuv.get(sphere.geometry.index.array[i * 3 + 1])[1] =
        intersects[1][0].uv;
      map_index2vecuv.get(sphere.geometry.index.array[i * 3 + 2])[1] =
        intersects[2][0].uv;
    }
  }
  console.log(map_index2vecuv);
  console.log("array_hitting_indices", array_hitting_indices);
  const set_unique_hit_indices = new Set(array_hitting_indices);
  console.log("set_unique_hit_indices", set_unique_hit_indices);
  const map_oldindex = new Map();
  const floatarray_indices = new Uint16Array(array_hitting_indices.length);
  let i = 0;
  for (let item of set_unique_hit_indices) {
    array_hitting_position.push(map_index2vecuv.get(item)[0].x);
    array_hitting_position.push(map_index2vecuv.get(item)[0].y);
    array_hitting_position.push(map_index2vecuv.get(item)[0].z);

    array_hitting_uv.push(map_index2vecuv.get(item)[1].x);
    array_hitting_uv.push(map_index2vecuv.get(item)[1].y);

    map_oldindex.set(item, i);
    i++;
  }
  // set new indices for new geometry
  for (let i = 0; i < array_hitting_indices.length; i++) {
    floatarray_indices[i] = map_oldindex.get(array_hitting_indices[i]);
  }

  // buffer geometry
  const geometry_front = new THREE.BufferGeometry();
  geometry_front.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(array_hitting_position), 3)
  );
  geometry_front.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(array_hitting_uv), 2)
  );
  geometry_front.setIndex(new THREE.BufferAttribute(floatarray_indices, 1));

  const mesh = new THREE.Mesh(
    geometry_front,
    // new THREE.MeshBasicMaterial({
    //   color: 0xff0000,
    //   side: THREE.DoubleSide,
    // })
    material
  );
  console.log(new THREE.BufferAttribute(sphere.geometry.index.array, 1));
  console.log(
    new THREE.BufferAttribute(new Float32Array(array_hitting_indices), 1)
  );
  scene.add(mesh);
  console.log(geometry_front);

  // sun
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

  // scene.add(water);

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
    model.scale.set(0.25, 0.25, 0.25);
    model.position.set(0, -7, 0);
  });

  // control
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  window.addEventListener("resize", onWindowResize);
  // scene.remove(sphere);
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

window.onkeydown = (e) => console.log("FocalLength:", helper);

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
