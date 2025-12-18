import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.180.0/three.module.js';
// import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three-gltf-loader@1.111.0/index.min.js';
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
import { STUDENTS } from '../assets/data/students.js';

let scene, camera, renderer;
let atoms = [];

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(light);

    // Load 3D model
    const loader = new GLTFLoader();
    loader.load('../assets/3d/model.gltf', (gltf) => {
        const model = gltf.scene;
        model.scale.set(2, 2, 2);
        scene.add(model);
    });

    // Create atom links
    createAtoms();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);

    animate();
}

function createAtoms() {
    const radius = 6;
    const atomCount = STUDENTS.length;

    STUDENTS.forEach((student, index) => {
        const angle = (index / atomCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, 0);

        sphere.userData = { student, originalColor: 0x00ff00 };
        scene.add(sphere);
        atoms.push(sphere);
    });
}

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let hoveredAtom = null;

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(atoms);

    if (hoveredAtom) {
        hoveredAtom.material.color.setHex(hoveredAtom.userData.originalColor);
        document.body.style.cursor = 'default';
    }

    if (intersects.length > 0) {
        hoveredAtom = intersects[0].object;
        hoveredAtom.material.color.setHex(0xffff00);
        document.body.style.cursor = 'pointer';
    } else {
        hoveredAtom = null;
    }
}

function onMouseClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(atoms);

    if (intersects.length > 0) {
        const clickedAtom = intersects[0].object;
        const studentId = clickedAtom.userData.student.id;
        document.location.hash = `#student-${studentId}`;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    scene.rotation.z += 0.001;
    renderer.render(scene, camera);
}

init();