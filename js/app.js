import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { STUDENTS } from '../assets/data/students.js';

class AtomScene {
    constructor() {
        this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
        this.camera.position.z = 12;

        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.isMobile,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.setPixelRatio(this.isMobile ? 1 : devicePixelRatio);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        if (!this.isMobile) {
            this.cssRenderer = new CSS3DRenderer();
            this.cssRenderer.setSize(innerWidth, innerHeight);
            this.cssRenderer.domElement.style.position = 'absolute';
            this.cssRenderer.domElement.style.top = '0';
            this.cssRenderer.domElement.style.pointerEvents = 'none';
            document.body.appendChild(this.cssRenderer.domElement);
        }

        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.lastRaycast = 0;

        this.atomCount = this.isMobile ? Math.min(STUDENTS.length, 15) : STUDENTS.length;
        this.atomData = [];

        this.hoveredIndex = null;
        this.currentModal = null;
        this.animationPaused = false;

        this.initLights();
        if (!this.isMobile) this.initBloom();

        this.loadNucleus();
        this.createAtoms();
        this.addEvents();
        this.animate();
    }

    /* ---------- LIGHTS (4) ---------- */
    initLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, this.isMobile ? 1 : 0.6));

        if (!this.isMobile) {
            const p = new THREE.PointLight(0x88ccff, 2, 30);
            p.position.set(6, 6, 6);
            this.scene.add(p);
        }
    }

    /* ---------- BLOOM ---------- */
    initBloom() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(
            new UnrealBloomPass(
                new THREE.Vector2(innerWidth, innerHeight),
                1.2, 0.6, 0.2
            )
        );
    }

    /* ---------- NUCLEUS ---------- */
    loadNucleus() {
        const loader = new GLTFLoader();
        loader.load(
            new URL('../assets/3d/model.gltf', import.meta.url).href,
            gltf => {
                this.nucleus = gltf.scene;
                
                this.nucleus.scale.setScalar(0.1);
                this.nucleus.traverse(child => {
                    if (child.isMesh) {
                        child.material.emissive.setHex(0xab61ff);
                        child.material.emissiveIntensity = 0.0495;
                        if (!this.isMobile) {
                            child.material.emissiveIntensity = 0.0295;
                        }
                    }
                });
                this.scene.add(this.nucleus);
            },
            undefined,
            () => {
                this.nucleus = new THREE.Mesh(
                    new THREE.SphereGeometry(1, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0xab61ff })
                );
                this.scene.add(this.nucleus);
            }
        );
    }

    /* ---------- ATOMS (1) ---------- */
    createAtoms() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = this.isMobile
            ? new THREE.MeshBasicMaterial({ color: 0x00ffcc })
            : new THREE.MeshStandardMaterial({ color: 0x00ffcc });

        this.atoms = new THREE.InstancedMesh(geometry, material, this.atomCount);
        this.scene.add(this.atoms);

        const dummy = new THREE.Object3D();

        for (let i = 0; i < this.atomCount; i++) {
            const radius = 5 + Math.random() * 3;
            const speed = 0.2 + Math.random() * 0.3;
            const angle = Math.random() * Math.PI * 2;

            this.atomData.push({
                student: STUDENTS[i],
                radius,
                speed,
                angle,
                selected: false
            });

            dummy.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * 0.5,
                Math.sin(angle) * radius
            );
            dummy.updateMatrix();
            this.atoms.setMatrixAt(i, dummy.matrix);
        }

        this.atoms.instanceMatrix.needsUpdate = true;
    }

    /* ---------- MODAL (3) ---------- */
    create3DModal(student, position) {
        if (this.isMobile) return null;

        const div = document.createElement('div');
        div.className = 'student-modal-3d';
        div.innerHTML = `<h3>${student.name}</h3>`;

        const obj = new CSS3DObject(div);
        obj.position.copy(position).add(new THREE.Vector3(0, 0.5, 0));
        obj.scale.setScalar(0.01);

        this.scene.add(obj);
        return obj;
    }

    /* ---------- EVENTS (2) ---------- */
    addEvents() {
        const move = e => {
            const p = e.touches ? e.touches[0] : e;
            this.mouse.x = (p.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(p.clientY / innerHeight) * 2 + 1;
            this.checkHover();
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, { passive: true });

        window.addEventListener('resize', () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
            if (this.composer) this.composer.setSize(innerWidth, innerHeight);
            if (this.cssRenderer) this.cssRenderer.setSize(innerWidth, innerHeight);
        });
    }

    /* ---------- RAYCAST (2) ---------- */
    checkHover() {
        const now = performance.now();
        if (now - this.lastRaycast < 80) return;
        this.lastRaycast = now;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObject(this.atoms);

        if (!hits.length) {
            this.hoveredIndex = null;
            if (this.currentModal) {
                this.scene.remove(this.currentModal);
                this.currentModal = null;
            }
            this.animationPaused = false;
            return;
        }

        const id = hits[0].instanceId;
        if (id === this.hoveredIndex) return;

        this.hoveredIndex = id;
        this.animationPaused = true;

        if (this.currentModal) this.scene.remove(this.currentModal);

        const pos = new THREE.Vector3();
        hits[0].object.getMatrixAt(id, new THREE.Matrix4()).decompose(pos, new THREE.Quaternion(), new THREE.Vector3());

        this.currentModal = this.create3DModal(this.atomData[id].student, pos);
    }

    /* ---------- ANIMATION ---------- */
    animateAtoms() {
        if (this.animationPaused) return;

        const dummy = new THREE.Object3D();

        for (let i = 0; i < this.atomCount; i++) {
            const d = this.atomData[i];
            d.angle += d.speed * 0.01;

            dummy.position.set(
                Math.cos(d.angle) * d.radius,
                Math.sin(d.angle * 2) * 0.5,
                Math.sin(d.angle) * d.radius
            );
            dummy.updateMatrix();
            this.atoms.setMatrixAt(i, dummy.matrix);
        }

        this.atoms.instanceMatrix.needsUpdate = true;
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        if (this.nucleus && !this.animationPaused) {
            this.nucleus.rotation.y += 0.002;
        }

        this.animateAtoms();

        if (this.composer) this.composer.render();
        else this.renderer.render(this.scene, this.camera);

        if (this.cssRenderer && this.currentModal) {
            this.cssRenderer.render(this.scene, this.camera);
        }
    };
}

new AtomScene();
