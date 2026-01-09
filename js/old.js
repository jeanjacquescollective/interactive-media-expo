import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { STUDENTS } from '../assets/data/students.js';

class AtomScene {
    constructor() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
        this.camera.position.z = 12;

        this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile });
        const pixelRatio = this.isMobile ? 1 : devicePixelRatio;
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.setPixelRatio(pixelRatio);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // CSS3D Renderer for 3D HTML elements
        this.cssRenderer = new CSS3DRenderer();
        this.cssRenderer.setSize(innerWidth, innerHeight);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = '0';
        this.cssRenderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(this.cssRenderer.domElement);

        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();

        this.nucleus = null;

        this.atomData = [];
        this.atomMeshes = new THREE.Group();
        this.scene.add(this.atomMeshes);
        this.hoveredIndex = null;

        this.rotatingLights = [];
        this.originalColors = new Map();

        this.animationPaused = false;
        this.currentModal = null;

        // this.initLights();
        this.initRotatingLights();
        if (!this.isMobile) {
            this.initBloom();
            this.addEvents();

        }
        this.loadNucleus();
        this.createAtoms();
        this.animate();
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, this.isMobile ? 0.8 : 1));
        const key = new THREE.PointLight(0x88ccff, this.isMobile ? 1.5 : 3, 40);
        key.position.set(6, 6, 6);
        this.scene.add(key);
    }

    initRotatingLights() {
        const colors = [0xff4444, 0x44ff44, 0x4444ff];
        const count = this.isMobile ? 1 : 3; // Only 1 light on mobile
        const radius = 3;

        for (let idx = 0; idx < count; idx++) {
            const light = new THREE.PointLight(colors[idx], this.isMobile ? 1 : 1.5, 10, 2);
            light.position.set(Math.cos(idx * 2) * radius, 0, Math.sin(idx * 2) * radius);
            this.scene.add(light);
            this.rotatingLights.push({ light, radius, speed: 0.5 + Math.random() * 0.5, angle: Math.random() * Math.PI * 2 });
        }
    }

    initBloom() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.3, 0.6, 0.15);
        this.composer.addPass(bloom);
    }

    loadNucleus() {
        const loader = new GLTFLoader();
        loader.load(
            new URL('../assets/3d/model.gltf', import.meta.url).href,
            (gltf) => {
                this.nucleus = gltf.scene;
                this.nucleus.scale.setScalar(0.1);
                this.nucleus.traverse(child => {
                    if (child.isMesh) {
                        child.material.emissive.setHex(0xffff00);
                        child.material.emissiveIntensity = 0.0035;
                    }
                });
                this.scene.add(this.nucleus);
            },
            undefined,
            () => {
                const geometry = new THREE.SphereGeometry(1, this.isMobile ? 16 : 32, this.isMobile ? 16 : 32);
                const material = new THREE.MeshStandardMaterial({
                    color: 0xffaa00,
                    emissive: 0xffff00,
                    emissiveIntensity: 0.0035
                });
                this.nucleus = new THREE.Mesh(geometry, material);
                this.scene.add(this.nucleus);
            }
        );
    }

    createAtoms() {
        const geometry = new THREE.SphereGeometry(0.2, this.isMobile ? 8 : 16, this.isMobile ? 8 : 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffaa, emissiveIntensity: 0.4 });

        const atomCount = this.isMobile ? Math.min(STUDENTS.length, 15) : STUDENTS.length; // Limit atoms on mobile

        for (let i = 0; i < atomCount; i++) {
            const student = STUDENTS[i];
            const atom = new THREE.Mesh(geometry, material.clone());
            const radius = 5 + Math.random() * 3;
            const speed = 0.2 + Math.random() * 0.3;
            const angle = Math.random() * Math.PI * 2;

            atom.userData = { student, radius, speed, angle, selected: false };
            atom.position.set(Math.cos(angle) * radius, Math.sin(angle) * 0.5, Math.sin(angle) * radius);

            this.atomMeshes.add(atom);
            this.atomData.push(atom);
            this.originalColors.set(atom, 0x00ffcc);
        }
    }

    create3DModal(student, atom) {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'student-modal-3d';
        modalDiv.innerHTML = `
            <div class="modal-content">
                <h3>${student.name}</h3>
            </div>
        `;

        const cssObject = new CSS3DObject(modalDiv);
        cssObject.position.copy(atom.position);
        cssObject.position.y += 0.5;
        cssObject.scale.setScalar(0.01);

        this.scene.add(cssObject);
        return cssObject;
    }

    addEvents() {
        window.addEventListener('touchmove', e => {
            const touch = e.touches[0];
            this.mouse.x = (touch.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / innerHeight) * 2 + 1;
            this.checkHover();
        }, { passive: true });

        window.addEventListener('mousemove', e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
            this.checkHover();
        });

        window.addEventListener('click', () => {
            if (this.hoveredIndex !== null) {
                this.atomData.forEach(a => a.userData.selected = false);
                this.atomData[this.hoveredIndex].userData.selected = true;
                location.hash = `#student-${this.atomData[this.hoveredIndex].userData.student.id}`;
            }
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
            if (this.composer) this.composer.setSize(innerWidth, innerHeight);
            this.cssRenderer.setSize(innerWidth, innerHeight);
        });
    }

    checkHover() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.atomData);

        if (intersects.length > 0) {
            const newHoveredIndex = this.atomData.indexOf(intersects[0].object);
            if (this.hoveredIndex !== newHoveredIndex) {
                if (this.hoveredIndex !== null) {
                    const prevAtom = this.atomData[this.hoveredIndex];
                    prevAtom.material.color.setHex(this.originalColors.get(prevAtom));
                }

                this.hoveredIndex = newHoveredIndex;
                const atom = this.atomData[this.hoveredIndex];
                atom.material.color.setHex(0xffff00);

                if (this.currentModal) {
                    this.scene.remove(this.currentModal);
                }

                this.currentModal = this.create3DModal(atom.userData.student, atom);
                this.animationPaused = true;
            }
            document.body.style.cursor = 'pointer';
        } else {
            if (this.hoveredIndex !== null) {
                const atom = this.atomData[this.hoveredIndex];
                atom.material.color.setHex(this.originalColors.get(atom));

                if (this.currentModal) {
                    this.scene.remove(this.currentModal);
                    this.currentModal = null;
                }

                this.animationPaused = false;
            }
            this.hoveredIndex = null;
            document.body.style.cursor = 'default';
        }
    }

    animateAtoms() {
        if (this.animationPaused) return;

        this.atomData.forEach(atom => {
            const d = atom.userData;
            d.angle += d.speed * 0.01;

            let x = Math.cos(d.angle) * d.radius;
            let z = Math.sin(d.angle) * d.radius;
            let y = Math.sin(d.angle * 2) * 0.5;

            if (d.selected) {
                const dir = new THREE.Vector3().subVectors(this.camera.position, atom.position).normalize();
                x += dir.x * 1.5;
                y += dir.y * 1.5;
                z += dir.z * 1.5;
            }

            atom.position.set(x, y, z);
        });
    }

    animateRotatingLights() {
        if (this.animationPaused) return;

        const t = this.clock.getElapsedTime();
        this.rotatingLights.forEach(r => {
            r.angle += r.speed * 0.01;
            r.light.position.set(Math.cos(r.angle) * r.radius, Math.sin(t) * 0.5, Math.sin(r.angle) * r.radius);
        });
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        if (this.nucleus && !this.animationPaused) {
            const vec = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
            vec.unproject(this.camera);
            this.nucleus.lookAt(vec);
        }

        this.animateAtoms();
        this.animateRotatingLights();

        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        this.cssRenderer.render(this.scene, this.camera);
    };
}

new AtomScene();
