var userInput = window.location.href; //prompt("Input your IP Address" + "");
console.log(window.location.href);
// let ws_address_list = [];
// ws_address_list.push("ws://" + userInput + ":30001");
// ws_address_list.push("ws://" + userInput + ":30002");
// ws_address_list.push("ws://" + userInput + ":30003");
// ws_address_list.push("ws://" + userInput + ":30004");

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
import { CameraHelper, PerspectiveCamera } from "three";
// ExtrinsicParameters
const fx = 357.142857;
const fy = 357.143665;
const cx = 642.098939;
const cy = 357.853665;

const img_width = 1280;
const img_height = 720;

const ctx0 = document.createElement("canvas").getContext("2d");
ctx0.canvas.width = img_width;
ctx0.canvas.height = img_height;

const ctx1 = document.createElement("canvas").getContext("2d");
ctx1.canvas.width = img_width;
ctx1.canvas.height = img_height;

const ctx2 = document.createElement("canvas").getContext("2d");
ctx2.canvas.width = img_width;
ctx2.canvas.height = img_height;

const ctx3 = document.createElement("canvas").getContext("2d");
ctx3.canvas.width = img_width;
ctx3.canvas.height = img_height;

const video0 = document.getElementById("video0");
const video1 = document.getElementById("video1");
const video2 = document.getElementById("video2");
const video3 = document.getElementById("video3");
if (video0.paused) {
  video0.play();
}
if (video1.paused) {
  video1.play();
}
if (video2.paused) {
  video2.play();
}
if (video3.paused) {
  video3.play();
}

let camera, scene, renderer;
let controls, water, sun;
let mesh_front, mesh_left, mesh_right, mesh_rear;
let camera_BEV,
  camera_calibrated_front,
  camera_calibrated_left,
  camera_calibrated_right,
  camera_calibrated_rear;

console.log(document.getElementById("glb"));
init();

// waitError();

progressAddBowl();
animate();
// geo_idx order in clockwise -> front right rear left
function _CreateSectorGeo(seg_w, seg_h, geo_idx, camera_calibrated) {
  let ref_camera;
  const camera_rotated = camera_BEV.clone();
  camera_rotated.up.set(0, 0, -1);
  camera_rotated.lookAt(0, -1, camera_rotated.position.z);
  camera_rotated.rotateY((-Math.PI / 2) * geo_idx);
  camera_rotated.rotateX(-Math.PI / 4);

  scene.add(camera_rotated);
  camera_rotated.updateWorldMatrix();

  const helper = new THREE.CameraHelper(camera_rotated);
  // scene.add(helper);

  // input Segments
  const geometry = new THREE.BufferGeometry();
  let unitSpherePoint = [];
  let vertices = [];
  let uvs = [];
  let grid = [];
  let indices = [];
  let index = 0;
  const thetaLength = (2 * Math.PI) / 4;
  const thetaStart = -Math.PI / 2 - thetaLength / 2;
  const blend_pos_y = 0.4; //0.6
  const zeroLevel = Math.sin((blend_pos_y * Math.PI) / 2);
  const bevScale = 1.55;
  // set vertices position & basic uv
  for (let j = 0; j < seg_h; j++) {
    let verticesRow = [];
    for (let i = 0; i < seg_w; i++) {
      const idx = j * seg_w + i;
      const px = i / (seg_w - 1);
      const py = j / (seg_h - 1);
      // const horisontalAngle = ((3 * Math.PI) / 4) * px;
      const horisontalAngle =
        (geo_idx * Math.PI) / 2 + thetaStart + thetaLength * px;
      const verticalAngle = (Math.PI / 2) * py * 0.9;
      // _pointOnSphere
      const horizontalR = Math.cos(verticalAngle);
      unitSpherePoint[0] = Math.cos(horisontalAngle) * horizontalR;
      unitSpherePoint[1] = Math.sin(horisontalAngle) * horizontalR;
      unitSpherePoint[2] = Math.sin(verticalAngle);
      let z = -(unitSpherePoint[2] - zeroLevel) / zeroLevel;
      if (z > 0) {
        z = z * z * 0.85; // in order to smooth up the flatten to wall transition
        ref_camera = camera_rotated;
      } else {
        z = 0.0; // flatten lower part
        ref_camera = camera_BEV;
      }
      // unitSpherePoint[3 * idx + 2] = Math.sin(verticalAngle) ;
      vertices[3 * idx] = unitSpherePoint[0] * 15;
      vertices[3 * idx + 1] = unitSpherePoint[1] * 15;
      vertices[3 * idx + 2] = -z * 15;

      let pt_f = [];
      pt_f[0] = unitSpherePoint[0]; //* bevScale;
      pt_f[1] = unitSpherePoint[1]; //* bevScale;
      pt_f[2] = -z;
      // vertices geometry scale
      pt_f[0] *= 15.0;
      pt_f[1] *= 15.0;
      pt_f[2] *= 15.0;
      let vec_pt_f = new THREE.Vector3(pt_f[0], pt_f[1], pt_f[2]);

      // vec_pt_k on nearplane
      let vec_pt_k = vec_pt_f.clone().project(ref_camera);
      vec_pt_k.z = -1;

      // vec_pt_k to WS is vec_pt_r
      // vec_dir used as a direction vector
      let vec_pt_r = vec_pt_k.unproject(ref_camera);
      let vec_dir = vec_pt_r.clone().sub(ref_camera.position);
      const float_to_z_zero = -ref_camera.position.z / vec_dir.z;
      // vec_pt_r to z=0 plane
      vec_pt_r = ref_camera.position
        .clone()
        .add(vec_dir.clone().multiplyScalar(float_to_z_zero));

      let vec_pt_res = vec_pt_r.clone().project(camera_calibrated);

      // [-1, 1]
      let pt_res = [];
      pt_res[0] = vec_pt_res.x;
      pt_res[1] = vec_pt_res.y;

      pt_res = _distortPoint(pt_res);
      uvs[2 * idx] = pt_res[0];
      uvs[2 * idx + 1] = pt_res[1];
      verticesRow.push(index++);
    }
    grid.push(verticesRow);
  }
  // set vertices Index by array 'grid'
  for (let j = 0; j < seg_h - 1; j++) {
    for (let i = 0; i < seg_w - 1; i++) {
      const a = grid[j][i + 1];
      const b = grid[j][i];
      const c = grid[j + 1][i];
      const d = grid[j + 1][i + 1];
      indices.push(a, b, d);
      indices.push(b, c, d);
      // if (j !== 0 || thetaStart >= 0)
      // if (j !== seg_h - 1 || thetaEnd < Math.PI)
    }
  }
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices), 3)
  );
  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(uvs), 2)
  );
  geometry.setIndex(indices);
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.uv.needsUpdate = true;

  const wireframe = new THREE.WireframeGeometry(geometry);

  const line = new THREE.LineSegments(wireframe);
  line.material.depthTest = false;
  line.material.opacity = 0.25;
  line.material.transparent = true;

  scene.add(line);
  return geometry;
}

function _distortPoint(Array_uv) {
  const K1 = 0.864082;
  const K2 = 0.116755;
  const K3 = -0.024516;
  const K4 = 0.013738;
  const K5 = -0.003442;
  const img_width = 1280;
  const img_height = 720;
  Array_uv[0] = (Array_uv[0] + 1) * 0.5;
  Array_uv[1] = (Array_uv[1] + 1) * 0.5;
  let position_x = Array_uv[0];
  let position_y = Array_uv[1];
  position_x *= img_width;
  position_y *= img_height;

  position_x = (position_x - cx) / fx;
  position_y = (position_y - cy) / fy;

  const rCam = Math.sqrt(position_x * position_x + position_y * position_y);
  let theta = Math.atan2(rCam, 1.0);
  const phi = Math.atan2(position_y, position_x);
  // if (theta > maxFOV / 2.0) {
  //   return EC_WRONG_PARAMETER;
  // } else if (theta < 0.0001) {
  //   return EC_WRONG_PARAMETER;
  // }

  const theta3 = Math.pow(theta, 3);
  const theta5 = Math.pow(theta, 5);
  const theta7 = Math.pow(theta, 7);
  const theta9 = Math.pow(theta, 9);

  const radial_distance =
    K1 * theta + K2 * theta3 + K3 * theta5 + K4 * theta7 + K5 * theta9;
  position_x = radial_distance * Math.cos(phi) * fx + cx;
  position_y = radial_distance * Math.sin(phi) * fy + cy;

  Array_uv[0] = position_x / img_width;
  Array_uv[1] = position_y / img_height;
  // console.log(Array_uv);
  return Array_uv;
}

function update_video() {
  ctx0.drawImage(video0, 0, 0, ctx0.canvas.width, ctx0.canvas.height);
  ctx1.drawImage(video1, 0, 0, ctx1.canvas.width, ctx1.canvas.height);
  ctx2.drawImage(video3, 0, 0, ctx2.canvas.width, ctx2.canvas.height);
  ctx3.drawImage(video2, 0, 0, ctx3.canvas.width, ctx3.canvas.height);
}

function Set_jsmpeg(ws_address, canvas) {
  const client = new WebSocket(ws_address);
  const player = new jsmpeg(client, {
    canvas: canvas,
  });
}

async function waitError() {
  const client = new WebSocket(ws_address_list[0]);
  client.onerror = function (e) {
    console.log(e);
    userInput = prompt("Input proper IP Address" + "");
    ws_address_list = reset_IP_List(userInput);
    Set_jsmpeg(ws_address_list[0], ctx0.canvas);
    Set_jsmpeg(ws_address_list[1], ctx1.canvas);
    Set_jsmpeg(ws_address_list[2], ctx2.canvas);
    Set_jsmpeg(ws_address_list[3], ctx3.canvas);
    waitError();
  };
  client.onopen = function (e) {
    Set_jsmpeg(ws_address_list[0], ctx0.canvas);
    Set_jsmpeg(ws_address_list[1], ctx1.canvas);
    Set_jsmpeg(ws_address_list[2], ctx2.canvas);
    Set_jsmpeg(ws_address_list[3], ctx3.canvas);
  };
}

function createCamTexture(context, geometry) {
  const texture = new THREE.CanvasTexture(context.canvas);
  // texture.flipY = false;
  // const material = new THREE.MeshBasicMaterial({
  //   side: THREE.FrontSide,
  //   transparent: true,
  //   map: texture,
  // });
  const material = new THREE.ShaderMaterial({
    side: THREE.FrontSide,
    transparent: true,
    uniforms: {
      time: { value: 1.0 },
      colorTexture: { value: texture },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragment_shader_single")
      .textContent,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.material.needsUpdate = true;
  return mesh;
}
function blendCamTexture(context, context_l, context_r, geometry) {
  const texture = new THREE.CanvasTexture(context.canvas);
  texture.flipY = false;
  const texture_l = new THREE.CanvasTexture(context_l.canvas);
  texture_l.flipY = false;
  const texture_r = new THREE.CanvasTexture(context_r.canvas);
  texture_r.flipY = false;
  // const material = new THREE.MeshBasicMaterial({
  //   side: THREE.FrontSide,
  //   transparent: true,
  //   map: texture,
  // });
  const material = new THREE.ShaderMaterial({
    side: THREE.FrontSide,
    transparent: true,
    uniforms: {
      time: { value: 1.0 },
      colorTexture: { value: texture },
      colorTexture_L: { value: texture_l },
      colorTexture_R: { value: texture_r },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragment_shader_double")
      .textContent,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.material.needsUpdate = true;
  return mesh;
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

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "default",
  });
  // renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45,
    // window.innerWidth / window.innerHeight,
    1200 / 800,
    1,
    20000
  );
  camera.position.set(-7, 12, -13);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, -3, -8);
  camera.updateMatrix();
  // camera_BEV
  camera_BEV = new THREE.PerspectiveCamera(60, 1, 0.1, 30);
  camera_BEV.position.set(0, 0, -30);
  camera_BEV.up.set(0, -1, 0);
  camera_BEV.lookAt(0, 0, 0);
  scene.add(camera_BEV);
  // const helper_BEV = new THREE.CameraHelper(camera_BEV);
  // scene.add(helper_BEV);
  camera_BEV.updateWorldMatrix();
  console.log(camera_BEV);
  console.log(
    "projectionMatrix",
    new THREE.Matrix3().setFromMatrix4(camera_BEV.projectionMatrix)
  );
  console.log(
    "projectionMatrixInverse",
    new THREE.Matrix3().setFromMatrix4(camera_BEV.projectionMatrixInverse)
  );
  console.log("project", new THREE.Vector3(0, 0, -29.9).project(camera_BEV));
  console.log("unproject", new THREE.Vector3(0, 5, -24).unproject(camera_BEV));

  const axesHelper = new THREE.AxesHelper(50);
  scene.add(axesHelper);

  // front camera
  // parameter -> fx, fy, cx, cy, skew_c, width, height, near, far
  camera_calibrated_front = new CalibratedCamera(
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
  // helper_front.updateMatrix();
  camera_calibrated_front.updateWorldMatrix();
  // scene.add(helper_front);
  console.log(
    "camera_calibrated_front",
    new THREE.Vector3(0, -10, 0).project(camera_calibrated_front)
  );

  // left camera
  camera_calibrated_left = new CalibratedCamera(
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
  camera_calibrated_left.updateWorldMatrix();
  const helper_left = new THREE.CameraHelper(camera_calibrated_left);
  helper_left.updateMatrix();

  // right camera
  camera_calibrated_right = new CalibratedCamera(
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
  camera_calibrated_right.updateWorldMatrix();
  const helper_right = new THREE.CameraHelper(camera_calibrated_right);
  helper_right.updateMatrix();

  // rear
  camera_calibrated_rear = new CalibratedCamera(
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
  camera_calibrated_rear.updateWorldMatrix();
  const helper_rear = new THREE.CameraHelper(camera_calibrated_rear);
  helper_rear.updateMatrix();

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
  loader.load("./avikus_boat.glb", function (gltf) {
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

    // const T0 = new THREE.Matrix4().makeTranslation(
    //   centerPt.x,
    //   centerPt.y - 3,
    //   -centerPt.z
    // );
    const T0 = new THREE.Matrix4().makeTranslation(0, 1 / 0.024, 1 / 0.012);
    const T1 = new THREE.Matrix4().makeScale(
      (3.0 / diff.x) * 0.012,
      (3.0 / diff.y) * 0.012,
      (9.0 / diff.z) * 0.012
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
  // scene.remove(sphere);
  scene.remove(axesHelper);
}

function progressAddBowl() {
  console.log("progressAddBowl");
  const type_single = "fragment_shader_single";
  const type_double = "fragment_shader_double";
  const geometry_front = _CreateSectorGeo(128, 128, 0, camera_calibrated_front);
  console.log(geometry_front.attributes);
  // mesh_front = blendCamTexture(ctx0, ctx1, ctx2, geometry_front);
  mesh_front = createCamTexture(ctx0, geometry_front);
  scene.add(mesh_front);
  mesh_front.position.set(0, 0, 0);
  // mesh_front.rotateZ((-7 * Math.PI) / 8);

  const geometry_left = _CreateSectorGeo(128, 128, 3, camera_calibrated_left);
  mesh_left = createCamTexture(ctx1, geometry_left);
  scene.add(mesh_left);
  mesh_left.position.set(0, 0, 0);
  // // mesh_left.rotateZ((-11 * Math.PI) / 8);

  const geometry_right = _CreateSectorGeo(128, 128, 1, camera_calibrated_right);
  mesh_right = createCamTexture(ctx2, geometry_right);
  scene.add(mesh_right);
  mesh_right.position.set(0, 0, 0);
  // // mesh_right.rotateZ((-3 * Math.PI) / 8);

  const geometry_rear = _CreateSectorGeo(128, 128, 2, camera_calibrated_rear);
  // // mesh_rear = blendCamTexture(ctx3, ctx2, ctx1, geometry_rear);
  mesh_rear = createCamTexture(ctx3, geometry_rear);
  scene.add(mesh_rear);
  mesh_rear.position.set(0, 0, 0);
  // // mesh_rear.rotateZ(Math.PI / 8);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  update_video();
  render();
}

function render() {
  // const time = performance.now() * 0.001;
  // mesh_front.material.map.needsUpdate = true;
  mesh_front.material.uniforms.colorTexture.value.needsUpdate = true;

  // // mesh_front.material.uniforms.colorTexture_L.value.needsUpdate = true;
  // // mesh_front.material.uniforms.colorTexture_R.value.needsUpdate = true;

  mesh_left.material.uniforms.colorTexture.value.needsUpdate = true;
  mesh_right.material.uniforms.colorTexture.value.needsUpdate = true;

  mesh_rear.material.uniforms.colorTexture.value.needsUpdate = true;
  // // mesh_rear.material.uniforms.colorTexture_L.value.needsUpdate = true;
  // // mesh_rear.material.uniforms.colorTexture_R.value.needsUpdate = true;

  renderer.render(scene, camera);
}

window.onkeydown = (e) =>
  console.log(((2 * Math.atan2(2 * fy, 72)) / Math.PI) * 180);
