import * as THREE from "three";
import { OrbitControls } from "./OrbitControls.js";
import { Water } from "./Water.js";
import { Sky } from "./Sky.js";
import { GLTFLoader } from "./GLTFLoader.js";

var video = document.getElementById("video");
var video_2 = document.getElementById("video_2");
var video_3 = document.getElementById("video_3");
var video_4 = document.getElementById("video_4");

let url_list = [];
url_list.push("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
url_list.push(
  "https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8"
);
url_list.push(
  "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
);
url_list.push(
  "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8"
);

// https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
// https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8
// https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8
// https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8

function play_hls(video, url) {
  if (Hls.isSupported()) {
    const hls = new Hls({
      debug: true,
    });
    console.log("supported");
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      video.muted = true;
      video.play();
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    console.log("else if");
    video.src = url;
    video.addEventListener("canplay", function () {
      video.play();
    });
  }
}

play_hls(video, url_list[0]);
play_hls(video_2, url_list[1]);
play_hls(video_3, url_list[2]);
play_hls(video_4, url_list[3]);

let camera, scene, renderer;
let controls, water, sun;

init();
animate();

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

  //
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

  // mesh
  const geometry = new THREE.PlaneGeometry(50, 50, 50);

  const video_texture = new THREE.VideoTexture(video);
  const video_texture_2 = new THREE.VideoTexture(video_2);
  const video_texture_3 = new THREE.VideoTexture(video_3);
  const video_texture_4 = new THREE.VideoTexture(video_4);

  const material = new THREE.MeshBasicMaterial({ map: video_texture });
  const material_2 = new THREE.MeshBasicMaterial({ map: video_texture_2 });
  const material_3 = new THREE.MeshBasicMaterial({ map: video_texture_3 });
  const material_4 = new THREE.MeshBasicMaterial({ map: video_texture_4 });

  const mesh = new THREE.Mesh(geometry, material);
  const mesh_2 = new THREE.Mesh(geometry, material_2);
  const mesh_3 = new THREE.Mesh(geometry, material_3);
  const mesh_4 = new THREE.Mesh(geometry, material_4);

  mesh.position.set(35, 30, -30);
  mesh_2.position.set(-35, 30, -30);
  mesh_3.position.set(95, 30, -30);
  mesh_4.position.set(-95, 30, -30);
  scene.add(mesh);
  scene.add(mesh_2);
  scene.add(mesh_3);
  scene.add(mesh_4);

  // boat
  const loader = new GLTFLoader();
  loader.load("./cargoship.glb", function (gltf) {
    const model = gltf.scene;
    scene.add(model);
    model.scale.set(0.1, 0.1, 0.1);
    model.position.set(0, -25, 0);
  });

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

  water.material.uniforms["time"].value += 1.0 / 60.0;

  renderer.render(scene, camera);
}
