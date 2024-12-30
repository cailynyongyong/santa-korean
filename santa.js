import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import GUI from "lil-gui";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Conversation } from "@11labs/client";
import earthVertexShader from "./shaders/earth/vertex.glsl?raw";
import earthFragmentShader from "./shaders/earth/fragment.glsl?raw";
import atmosphereVertexShader from "./shaders/atmosphere/vertex.glsl?raw";
import atmosphereFragmentShader from "./shaders/atmosphere/fragment.glsl?raw";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
let santaModel, conversation;
/**
 * Base
 */
// // Debug
// const gui = new GUI();

// Canvas
const canvas = document.querySelector("#c");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();

/**
 * Models
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let mixer = null;

gltfLoader.load("/models/santa_final.glb", (gltf) => {
  santaModel = gltf.scene;
  santaModel.name = "Santa"; // Give it a name for identification
  scene.add(santaModel);

  santaModel.scale.set(0.5, 0.5, 0.5);
  // Rotate Santa around the Y-axis (adjust values as needed)
  santaModel.rotation.y = 140 * (Math.PI / 180);
  santaModel.position.y += 2;
});

/**
 * Fonts
 */
const matcapTexture = textureLoader.load("textures/matcaps/8.png");
matcapTexture.colorSpace = THREE.SRGBColorSpace;
const fontLoader = new FontLoader();

fontLoader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
  const textGeometry = new TextGeometry("click on Santa", {
    font: font,
    size: 0.8,
    depth: 0.5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5,
  });
  textGeometry.center();
  // const textMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
  const textMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, // Base color
    transmission: 0, // Fully transparent (glass effect)
    transparent: true,
    opacity: 1.0, // Ensure object is visible
    roughness: 0.65, // Higher roughness for frosted look
    metalness: 0, // Non-metallic
    ior: 1.45, // Typical for glass
    thickness: 1.0, // Increase for stronger refraction
    clearcoat: 1.0, // Glossy outer surface
    clearcoatRoughness: 0.1, // Slightly smoother top layer
  });

  const text = new THREE.Mesh(textGeometry, textMaterial);
  // Apply Santa's rotation and position
  text.rotation.y = 135 * (Math.PI / 180); // Same rotation as Santa
  text.position.set(0, 1, 0); // Adjust height and position to float near Santa
  text.scale.set(-0.5, 0.5, 0.5); // Optional scaling for size adjustment

  // Offset text to hover above Santa's head
  text.position.y += 6; // Adjust height if necessary
  // scene.add(text);

  // Animation to gently float the label
  const animateLabel = () => {
    text.position.y = 2 + Math.sin(Date.now() * 0.005) * 0.2;
    requestAnimationFrame(animateLabel);
  };
  animateLabel();
});

/**
 * Earth
 */

const earthParameters = {};
earthParameters.atmosphereDayColor = "#00aaff";
earthParameters.atmosphereTwilightColor = "#ff6600";

// gui.addColor(earthParameters, "atmosphereDayColor").onChange(() => {
//   earthMaterial.uniforms.uAtmosphereDayColor.value.set(
//     earthParameters.atmosphereDayColor
//   );
//   atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(
//     earthParameters.atmosphereDayColor
//   );
// });

// gui.addColor(earthParameters, "atmosphereTwilightColor").onChange(() => {
//   earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(
//     earthParameters.atmosphereTwilightColor
//   );
//   atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
//     earthParameters.atmosphereTwilightColor
//   );
// });

// Textures
const earthDayTexture = textureLoader.load("earth/day.jpg");
earthDayTexture.colorSpace = THREE.SRGBColorSpace;
earthDayTexture.anisotropy = 8;

const earthNightTexture = textureLoader.load("earth/night.jpg");
earthNightTexture.colorSpace = THREE.SRGBColorSpace;
earthNightTexture.anisotropy = 8;

const earthSpecularCloudsTexture = textureLoader.load(
  "earth/specularClouds.jpg"
);
earthSpecularCloudsTexture.anisotropy = 8;

// Mesh
const earthGeometry = new THREE.SphereGeometry(3, 64, 64);
const earthMaterial = new THREE.ShaderMaterial({
  vertexShader: earthVertexShader,
  fragmentShader: earthFragmentShader,
  uniforms: {
    uDayTexture: new THREE.Uniform(earthDayTexture),
    uNightTexture: new THREE.Uniform(earthNightTexture),
    uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereDayColor)
    ),
    uAtmosphereTwilightColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereTwilightColor)
    ),
  },
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.y -= 1.5;
scene.add(earth);

// Atmosphere
const atmosphereMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  transparent: true,
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  uniforms: {
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereDayColor)
    ),
    uAtmosphereTwilightColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereTwilightColor)
    ),
  },
});
const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial);
atmosphere.position.y -= 1.5;
atmosphere.scale.set(1.04, 1.04, 1.04);
// scene.add(atmosphere);

// /**
//  * Sun
//  */
// // Coordinates
// const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5);
// const sunDirection = new THREE.Vector3();

// // Debug
// const debugSun = new THREE.Mesh(
//   new THREE.IcosahedronGeometry(0.1, 2),
//   new THREE.MeshBasicMaterial()
// );
// scene.add(debugSun);

// // Update
// const updateSun = () => {
//   // Sun direction
//   sunDirection.setFromSpherical(sunSpherical);

//   // Debug
//   debugSun.position.copy(sunDirection).multiplyScalar(5);

//   // Uniforms
//   earthMaterial.uniforms.uSunDirection.value.copy(sunDirection);
//   atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);
// };

// updateSun();

// // Tweaks
// gui.add(sunSpherical, "phi").min(0).max(Math.PI).onChange(updateSun);

// gui.add(sunSpherical, "theta").min(-Math.PI).max(Math.PI).onChange(updateSun);

/**
 * Galaxy
 */
const parameters = {};
parameters.count = 10000;
parameters.size = 0.02;
parameters.radius = 50;

const generateGalaxy = () => {
  /**
   * Geometry
   */
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(parameters.count * 3);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;
    const radius = Math.random() * parameters.radius;

    // Spread points over larger radius
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;

    positions[i3] = Math.sin(angle1) * Math.cos(angle2) * radius;
    positions[i3 + 1] = Math.sin(angle1) * Math.sin(angle2) * radius;
    positions[i3 + 2] = Math.cos(angle1) * radius;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  /**
   * Material
   */
  const material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  /**
   * Points
   */
  const points = new THREE.Points(geometry, material);
  points.raycast = () => {};
  scene.add(points);
};

generateGalaxy();

// // Load HDR background
// const rgbeLoader = new RGBELoader();
// rgbeLoader.load("snowy_forest_path_01_4k.hdr", (texture) => {
//   texture.mapping = THREE.EquirectangularReflectionMapping; // Important for reflections
//   scene.background = texture; // Set as background
//   scene.environment = texture; // Set as environment map
// });

/**
 * Lights
//  */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3, 100);
directionalLight.castShadow = true;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

async function requestMicrophoneAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone access granted:", stream);
  } catch (error) {
    console.error("Microphone access denied:", error);
    alert("Microphone access is required to start the conversation.");
  }
}

let isConversationActive = false; // Track the conversation state

async function handleSantaClick() {
  if (isConversationActive) {
    // End the session if it is active
    try {
      await conversation.endSession();
      console.log("Conversation ended.");
      alert("Conversation ended.");
      isConversationActive = false; // Update state
    } catch (error) {
      console.error("Error ending conversation:", error);
      alert("Failed to end conversation.");
    }
  } else {
    // Start the session if it is not active
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation
      conversation = await Conversation.startSession({
        agentId: "8pIREAnvxJTGn4LnNW8c", // Replace with your agent ID
        onMessage: (message) => {
          console.log("Agent says:", message.text);
          alert(`Agent says: ${message.text}`); // Display the message
        },
        onConnect: () => console.log("Connected to ElevenLabs agent"),
        onDisconnect: () => console.log("Disconnected from agent"),
        onError: (error) => console.error("Conversation error:", error),
      });

      console.log("Conversation started!");
      alert("Conversation started.");
      isConversationActive = true; // Update state
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert(
        "Failed to start conversation. Ensure microphone access is granted."
      );
    }
  }
}

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Click Event for Santa
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections with Santa
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;

    // Check if the clicked object is part of Santa model
    if (isPartOfSanta(clickedObject)) {
      console.log("Santa clicked!");
      handleSantaClick(); // Start the ElevenLabs conversation
    }
  }
});

// Helper function to check if an object is part of Santa
function isPartOfSanta(object) {
  // Check if the object's name is one of the expected sub-mesh names
  const santaParts = [
    "Cube",
    "Cube001",
    "Cube002",
    "Cube003",
    "Cube004",
    "Cube005",
    "Cube006",
    "Cube007",
    "Cube008",
    "Cube009",
    "Cube010",
    "Cube011",
  ];
  return santaParts.includes(object.name);
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-8, 4, 8);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#000011");

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  earth.rotation.y = elapsedTime * 0.1;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
