//#region Import Libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
//#endregion

//#region Functions
const LERP = (start, end, amount) => start + (end - start) * amount;
const HEARTBEAT = (callback) => {
    let lastTime = Date.now();
    let f = () => {
        let currentTime = Date.now();
        callback((currentTime - lastTime) / 1000);
        lastTime = currentTime;
        requestAnimationFrame(f);
    };
    f();
};
//#endregion

//#region Definitions
const SCENE = new THREE.Scene();
const CAMERA = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const RENDERER = new THREE.WebGLRenderer({ alpha: true, antialias: true });
const LOADER = new GLTFLoader();
let MODEL = null;
let CONTROLS = null;
//#endregion

//#region Setup 3D Scene
const setup3D = () => {
    const container = document.getElementById('container3D');
    
    // Set renderer size to match container
    RENDERER.setSize(container.offsetWidth, container.offsetHeight);
    RENDERER.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(RENDERER.domElement);
    
    // Position camera
    CAMERA.position.z = 5;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    SCENE.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    SCENE.add(directionalLight);
    
    // Setup orbit controls
    CONTROLS = new OrbitControls(CAMERA, RENDERER.domElement);
    CONTROLS.enableDamping = true;
    CONTROLS.dampingFactor = 0.05;
    
    // Load model
    LOADER.load(
        'models/camera_lens.glb', // Change this to your model filename
        (gltf) => {
            MODEL = gltf.scene;
            SCENE.add(MODEL);
            
            // Center and scale the model (adjust as needed)
            const box = new THREE.Box3().setFromObject(MODEL);
            const center = box.getCenter(new THREE.Vector3());
            MODEL.position.sub(center);
            
            // Optional: Auto-scale to fit view
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim;
            MODEL.scale.setScalar(scale);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading model:', error);
        }
    );
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const container = document.getElementById('container3D');
        CAMERA.aspect = container.offsetWidth / container.offsetHeight;
        CAMERA.updateProjectionMatrix();
        RENDERER.setSize(container.offsetWidth, container.offsetHeight);
    });
    
    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate);
        
        if (MODEL) {
            MODEL.rotation.y += 0.005; // Slow rotation
        }
        
        CONTROLS.update();
        RENDERER.render(SCENE, CAMERA);
    };
    animate();
};
//#endregion

//#region Document
document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D scene
    setup3D();
    
    let currentScroll = 0;
    let desiredScroll = 0;

    window.addEventListener('wheel', e => {
        e.preventDefault();
        desiredScroll += e.deltaY;
        desiredScroll = Math.max(0, Math.min(desiredScroll, document.body.scrollHeight - window.innerHeight));
    }, { passive: false });

    HEARTBEAT(dt => {
        currentScroll = LERP(currentScroll, desiredScroll, 0.1);
        window.scrollTo(0, currentScroll);
    });
});
//#endregion
