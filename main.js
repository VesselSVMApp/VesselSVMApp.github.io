// var userInput = prompt("Input your IP Address" + "");
var userInput = "";
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

// waitError();

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

function SetExtrinsicParameters(
  camera,
  Pos_x,
  Pos_y,
  Pos_z,
  Euler_x,
  Euler_y,
  Euler_z
) {
  const T_front = new THREE.Matrix4().makeTranslation(0, 0, 0);
  const S_front = new THREE.Matrix4().makeScale(1, -1, -1);
  const R_front = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(
      -1 * THREE.MathUtils.degToRad(Euler_x),
      1 * THREE.MathUtils.degToRad(Euler_y),
      1 * THREE.MathUtils.degToRad(Euler_z)
    )
  );

  const M_front = new THREE.Matrix4().multiplyMatrices(R_front, S_front);

  const M_front_inverse = M_front.clone();
  M_front_inverse.invert();
  const M3_front_inverse = new THREE.Matrix3().setFromMatrix4(M_front_inverse);

  const camPosWS_front = new THREE.Vector3(Pos_x, Pos_y, Pos_z);
  const camUpWS_front = new THREE.Vector3(0, 1, 0).applyMatrix3(
    M3_front_inverse
  );
  const camViewWS_front = new THREE.Vector3(0, 0, -1).applyMatrix3(
    M3_front_inverse
  );
  const camAtWS_front = camPosWS_front.clone();
  camAtWS_front.add(camViewWS_front);

  camera.position.set(camPosWS_front.x, camPosWS_front.y, camPosWS_front.z);
  camera.up.set(camUpWS_front.x, camUpWS_front.y, camUpWS_front.z);
  camera.lookAt(camAtWS_front.x, camAtWS_front.y, camAtWS_front.z);
}

function CreateImagePlane(camera) {
  const LeftTop_near = new THREE.Vector3(-1, 1, 0.9).unproject(camera);
  const RightTop_near = new THREE.Vector3(1, 1, 0.9).unproject(camera);
  const LeftBottom_near = new THREE.Vector3(-1, -1, 0.9).unproject(camera);
  const RightBottom_near = new THREE.Vector3(1, -1, 0.9).unproject(camera);
  const imageplane_geometry = new THREE.BufferGeometry();
  imageplane_geometry.setAttribute(
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
  imageplane_geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2)
  );
  imageplane_geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      2
    )
  );
  imageplane_geometry.setIndex(
    new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1)
  );

  const imageplane = new THREE.Mesh(
    imageplane_geometry,
    new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
    })
  );
  imageplane.position.set(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );
  imageplane.quaternion.copy(camera.quaternion);
  imageplane.updateMatrixWorld();
  return imageplane;
}
function createGeometrybyHitting(camera, imageplane, bowl) {
  const array_indices = Array.from(new Set(bowl.geometry.index.array));
  const map_index2vecuv = new Map();
  const array_vecuv = [];

  const vec_cam = new THREE.Vector3(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );
  for (let i = 0; i < bowl.geometry.attributes.position.array.length / 3; i++) {
    array_vecuv.push([
      new THREE.Vector3()
        .fromBufferAttribute(bowl.geometry.attributes.position, i)
        .add(bowl.position),
    ]);
    map_index2vecuv.set(array_indices[i], array_vecuv[i]);
  }
  const array_hitting_indices = [];
  const array_hitting_position = [];
  const array_hitting_uv = [];
  for (let i = 0; i < bowl.geometry.index.array.length / 3; i++) {
    const raycaster = new THREE.Raycaster(
      map_index2vecuv.get(bowl.geometry.index.array[i * 3])[0],
      vec_cam
        .clone()
        .sub(map_index2vecuv.get(bowl.geometry.index.array[i * 3])[0])
        .normalize(),
      0,
      map_index2vecuv
        .get(bowl.geometry.index.array[i * 3])[0]
        .distanceTo(vec_cam)
    );
    const raycaster_1 = new THREE.Raycaster(
      map_index2vecuv.get(bowl.geometry.index.array[i * 3 + 1])[0],
      vec_cam
        .clone()
        .sub(map_index2vecuv.get(bowl.geometry.index.array[i * 3 + 1])[0])
        .normalize(),
      0,
      map_index2vecuv
        .get(bowl.geometry.index.array[i * 3 + 1])[0]
        .distanceTo(vec_cam)
    );
    const raycaster_2 = new THREE.Raycaster(
      map_index2vecuv.get(bowl.geometry.index.array[i * 3 + 2])[0],
      vec_cam
        .clone()
        .sub(map_index2vecuv.get(bowl.geometry.index.array[i * 3 + 2])[0])
        .normalize(),
      0,
      map_index2vecuv
        .get(bowl.geometry.index.array[i * 3 + 2])[0]
        .distanceTo(vec_cam)
    );
    const intersects = [];
    intersects.push(raycaster.intersectObject(imageplane));
    intersects.push(raycaster_1.intersectObject(imageplane));
    intersects.push(raycaster_2.intersectObject(imageplane));
    if (
      intersects[0].length == 1 &&
      intersects[1].length == 1 &&
      intersects[2].length == 1
    ) {
      array_hitting_indices.push(bowl.geometry.index.array[i * 3]);
      array_hitting_indices.push(bowl.geometry.index.array[i * 3 + 1]);
      array_hitting_indices.push(bowl.geometry.index.array[i * 3 + 2]);

      map_index2vecuv.get(bowl.geometry.index.array[i * 3])[1] =
        intersects[0][0].uv;
      map_index2vecuv.get(bowl.geometry.index.array[i * 3 + 1])[1] =
        intersects[1][0].uv;
      map_index2vecuv.get(bowl.geometry.index.array[i * 3 + 2])[1] =
        intersects[2][0].uv;
    }
  }
  const set_unique_hit_indices = new Set(array_hitting_indices);
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
  const buffergeometry = new THREE.BufferGeometry();
  buffergeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(array_hitting_position), 3)
  );
  buffergeometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(array_hitting_uv), 2)
  );
  buffergeometry.setIndex(new THREE.BufferAttribute(floatarray_indices, 1));
  return buffergeometry;
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
  camera.position.set(0, 5, -60);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);
  camera.updateMatrix();

  const axesHelper = new THREE.AxesHelper(50);
  scene.add(axesHelper);

  const video_0 = document.getElementById("cam0");
  if (video_0.paused) {
    video_0.play();
  }
  const video_1 = document.getElementById("cam1");
  if (video_1.paused) {
    video_1.play();
  }
  const video_2 = document.getElementById("cam2");
  if (video_2.paused) {
    video_2.play();
  }
  const video_3 = document.getElementById("cam3");
  if (video_3.paused) {
    video_3.play();
  }
  // sphere
  const geometry_sphere = new THREE.SphereGeometry(120, 360, 180); //(120, 256, 128);
  const sphere = new THREE.Mesh(
    geometry_sphere,
    new THREE.MeshPhongMaterial({
      color: 0xffff00,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.3,
    })
  );
  sphere.position.set(0, 0, -100);
  sphere.updateMatrixWorld();
  scene.add(sphere);

  // front camera
  // parameter -> fx, fy, cx, cy, skew_c, width, height, near, far
  const camera_calibrated_front = new CalibratedCamera(
    357.142857,
    357.143665,
    642.098939,
    357.853665,
    0,
    1280,
    720,
    0.1,
    100
  );
  // camera, Position, Euler
  SetExtrinsicParameters(
    camera_calibrated_front,
    -0.1,
    -6.45,
    -1.82,
    45,
    0.0001,
    0.001
  );

  scene.add(camera_calibrated_front);
  const helper_front = new THREE.CameraHelper(camera_calibrated_front);
  // scene.add(helper_front);
  helper_front.updateMatrix();
  camera_calibrated_front.updateMatrix();

  const texture_front = new THREE.VideoTexture(video_0);
  const material_front = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      time: { value: 1.0 },
      colorTexture: { value: texture_front },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragment_shader2").textContent,
  });

  const imageplane_front = CreateImagePlane(camera_calibrated_front);
  scene.add(imageplane_front);

  const geometry_front = createGeometrybyHitting(
    camera_calibrated_front,
    imageplane_front,
    sphere
  );
  const mesh_front = new THREE.Mesh(geometry_front, material_front);
  scene.add(mesh_front);

  // left camera
  const camera_calibrated_left = new CalibratedCamera(
    357.142857,
    357.143665,
    642.098939,
    357.853665,
    0,
    1280,
    720,
    0.1,
    100
  );
  SetExtrinsicParameters(
    camera_calibrated_left,
    -1.4,
    1.55,
    -2.16,
    41.0,
    0.5001,
    -87.5
  );
  scene.add(camera_calibrated_left);
  const helper_left = new THREE.CameraHelper(camera_calibrated_left);
  helper_left.updateMatrix();
  // scene.add(helper_left);

  const texture_left = new THREE.VideoTexture(video_1);
  const material_left = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      time: { value: 1.0 },
      colorTexture: { value: texture_left },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragment_shader2").textContent,
  });

  const imageplane_left = CreateImagePlane(camera_calibrated_left);
  scene.add(imageplane_left);

  const geometry_left = createGeometrybyHitting(
    camera_calibrated_left,
    imageplane_left,
    sphere
  );
  const mesh_left = new THREE.Mesh(geometry_left, material_left);
  scene.add(mesh_left);

  // right camera
  const camera_calibrated_right = new CalibratedCamera(
    357.142857,
    357.143665,
    642.098939,
    357.853665,
    0,
    1280,
    720,
    0.1,
    100
  );
  SetExtrinsicParameters(
    camera_calibrated_right,
    1.4,
    1.55,
    -2.16,
    41.0,
    0.0001,
    85.0
  );
  scene.add(camera_calibrated_right);
  const helper_right = new THREE.CameraHelper(camera_calibrated_right);
  helper_right.updateMatrix();
  // scene.add(helper_right);

  const texture_right = new THREE.VideoTexture(video_3);
  const material_right = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      time: { value: 1.0 },
      colorTexture: { value: texture_right },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragment_shader2").textContent,
  });

  const imageplane_right = CreateImagePlane(camera_calibrated_right);
  scene.add(imageplane_right);

  const geometry_right = createGeometrybyHitting(
    camera_calibrated_right,
    imageplane_right,
    sphere
  );
  const mesh_right = new THREE.Mesh(geometry_right, material_right);
  scene.add(mesh_right);

  // rear
  const camera_calibrated_rear = new CalibratedCamera(
    357.142857,
    357.143665,
    642.098939,
    357.853665,
    0,
    1280,
    720,
    0.1,
    100
  );
  SetExtrinsicParameters(
    camera_calibrated_rear,
    0.0,
    3.99,
    -1.25,
    61.0,
    1.0001,
    180.0
  );
  scene.add(camera_calibrated_rear);
  const helper_rear = new THREE.CameraHelper(camera_calibrated_rear);
  helper_rear.updateMatrix();
  // scene.add(helper_rear);

  const texture_rear = new THREE.VideoTexture(video_2);
  const material_rear = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    opacity: 0.9,
    transparent: true,
    uniforms: {
      time: { value: 1.0 },
      colorTexture: { value: texture_rear },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragment_shader2").textContent,
  });

  const imageplane_rear = CreateImagePlane(camera_calibrated_rear);
  scene.add(imageplane_rear);

  const geometry_rear = createGeometrybyHitting(
    camera_calibrated_rear,
    imageplane_rear,
    sphere
  );
  const mesh_rear = new THREE.Mesh(geometry_rear, material_rear);
  scene.add(mesh_rear);

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
    const model = gltf.scene.children[0];
    scene.add(model);

    //model.children[0];
    //model.rotateX(-Math.PI * 0.5);

    const box = new THREE.BoxHelper(model, 0xffff00);
    // scene.add(box);
    box.geometry.computeBoundingBox();

    const centerPt = new THREE.Vector3().addVectors(
      box.geometry.boundingBox.min,
      box.geometry.boundingBox.max
    );
    centerPt.multiplyScalar(-0.5);
    //model.position.set(centerPt.x, centerPt.y, centerPt.z);
    //model.updateMatrix();

    const diff = new THREE.Vector3().subVectors(
      box.geometry.boundingBox.max,
      box.geometry.boundingBox.min
    );
    //model.scale.set(3.0 / diff.x, 9.0 / diff.y, 3.0 / diff.z);

    const T0 = new THREE.Matrix4().makeTranslation(
      centerPt.x,
      centerPt.y,
      -centerPt.z
    );
    const T1 = new THREE.Matrix4().makeScale(
      3.0 / diff.x,
      3.0 / diff.y,
      9.0 / diff.z
    );
    const T2 = new THREE.Matrix4().multiplyMatrices(
      new THREE.Matrix4().makeRotationZ(Math.PI),
      new THREE.Matrix4().makeRotationX(-Math.PI * 0.5)
    );

    model.matrix = new THREE.Matrix4().multiplyMatrices(T2, T1);
    model.matrix.multiply(T0);
    model.matrixAutoUpdate = false;
  });

  // control
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  window.addEventListener("resize", onWindowResize);
  // remove mesh
  scene.remove(sphere);
  scene.remove(axesHelper);
  scene.remove(imageplane_front);
  scene.remove(imageplane_left);
  scene.remove(imageplane_right);
  scene.remove(imageplane_rear);
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
  // for streaming video
  // updateDataTexture(video, mesh);
  water.material.uniforms["time"].value += 1.0 / 60.0;

  renderer.render(scene, camera);
}

window.onkeydown = (e) => console.log();

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
