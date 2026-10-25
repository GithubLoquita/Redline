/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraView, GameSettings, VehicleConfig } from '../types';
import { CarComponents, createPlayerCar } from './carBuilder';
import { CityEnvironment } from './cityEnvironment';
import { PhysicsEngine } from './physicsEngine';

export class RacingScene {
  public container: HTMLElement;
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public city: CityEnvironment;
  public physics: PhysicsEngine;
  public playerCar: CarComponents;

  public currentVehicleId = 'hyperion';
  public customColor?: string;

  public isSoftwareGl = false;
  public isShowroom = true;
  public cameraView: CameraView = 'CHASE';

  // Showroom turntable variables
  private showroomAngle = 0;
  private showroomRadius = 6.2;
  private showroomHeight = 2.4;

  // Camera dynamics
  private cameraTarget = new THREE.Vector3();
  private cameraLookTarget = new THREE.Vector3();
  private shakeIntensity = 0;
  private targetFov = 65;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private headlightSpotL: THREE.SpotLight;
  private headlightSpotR: THREE.SpotLight;

  constructor(container: HTMLElement, vehicleId = 'hyperion', customColor?: string) {
    this.container = container;
    this.currentVehicleId = vehicleId;
    this.customColor = customColor;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Initialize Renderer
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'w-full h-full block';
    this.container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);

    // Scene & Fog
    this.scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x07070a);
    this.scene.background = bgColor;
    this.scene.fog = new THREE.FogExp2(0x07070a, 0.0075);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.2, 500);
    this.camera.position.set(0, 3, -6);

    // Setup RoomEnvironment for metallic PBR reflections
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (e) {
      console.warn('RoomEnvironment fallback', e);
    }

    // Studio Lighting
    this.hemiLight = new THREE.HemisphereLight(0x4466aa, 0x111116, 0.9);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.6);
    this.dirLight.position.set(15, 25, 10);
    if (!this.isSoftwareGl) {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 1;
      this.dirLight.shadow.camera.far = 120;
      const d = 25;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0005;
      this.dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.dirLight);

    // Player Car Headlight Beams (Spotlights)
    this.headlightSpotL = new THREE.SpotLight(0xaaccff, 4.0, 60, Math.PI / 6, 0.4);
    this.headlightSpotR = new THREE.SpotLight(0xaaccff, 4.0, 60, Math.PI / 6, 0.4);
    this.scene.add(this.headlightSpotL, this.headlightSpotR);
    this.scene.add(this.headlightSpotL.target, this.headlightSpotR.target);

    // Subsystems
    this.city = new CityEnvironment(this.scene);
    this.physics = new PhysicsEngine(this.scene);
    this.playerCar = createPlayerCar(this.currentVehicleId, this.customColor);
    this.scene.add(this.playerCar.rootGroup);

    this.setupShowroom();
    window.addEventListener('resize', this.onResize);
  }

  public setVehicle(vehicleId: string, customColor?: string, config?: VehicleConfig) {
    this.scene.remove(this.playerCar.rootGroup);
    this.currentVehicleId = vehicleId;
    this.customColor = customColor;
    this.playerCar = createPlayerCar(vehicleId, customColor);
    this.scene.add(this.playerCar.rootGroup);

    if (config) {
      this.physics.setVehicle(config);
    }
  }

  public setPaintColor(colorHex: string) {
    this.customColor = colorHex;
    this.playerCar.bodyMaterial.color.set(colorHex);
  }

  public setupShowroom() {
    this.isShowroom = true;
    this.playerCar.rootGroup.position.set(0, 0, 0);
    this.playerCar.rootGroup.rotation.set(0, 0, 0);
    this.camera.position.set(4.5, 1.8, 4.5);
    this.camera.lookAt(0, 0.6, 0);
  }

  public setupRace(vehicleConfig: VehicleConfig) {
    this.isShowroom = false;
    this.physics.setVehicle(vehicleConfig);
    this.physics.reset(0);
    this.cameraView = 'CHASE';
  }

  public triggerScreenShake(amount = 0.5) {
    this.shakeIntensity = Math.min(1.2, this.shakeIntensity + amount);
  }

  public update(delta: number, settings: GameSettings) {
    if (this.isShowroom) {
      // Rotate showroom camera smoothly around the showcase car
      this.showroomAngle += delta * 0.35;
      const camX = Math.sin(this.showroomAngle) * this.showroomRadius;
      const camZ = Math.cos(this.showroomAngle) * this.showroomRadius;

      this.camera.position.set(camX, this.showroomHeight, camZ);
      this.camera.lookAt(0, 0.7, 0);

      // Subtle wheel spin in showroom
      this.playerCar.wheels.forEach((w) => {
        w.rotation.x += delta * 0.5;
      });
    } else {
      // 1. Update City chunk wrapping & particles
      const speedRatio = Math.min(1.0, this.physics.speed / this.physics.maxSpeed);
      this.city.update(this.physics.z, speedRatio);

      // 2. Headlight Beams tracking player
      const carPos = this.playerCar.rootGroup.position;
      this.headlightSpotL.position.set(carPos.x - 0.65, carPos.y + 0.5, carPos.z + 2.2);
      this.headlightSpotL.target.position.set(carPos.x - 0.65, 0.1, carPos.z + 45);

      this.headlightSpotR.position.set(carPos.x + 0.65, carPos.y + 0.5, carPos.z + 2.2);
      this.headlightSpotR.target.position.set(carPos.x + 0.65, 0.1, carPos.z + 45);

      // Directional light follows player smoothly
      this.dirLight.position.set(carPos.x + 15, 30, carPos.z + 10);
      this.dirLight.target.position.set(carPos.x, 0, carPos.z + 15);

      // 3. Camera Follow Dynamics
      let desiredCamOffset = new THREE.Vector3(0, 2.7, -6.8);
      let desiredLookOffset = new THREE.Vector3(0, 1.2, 12);

      if (this.cameraView === 'HOOD') {
        desiredCamOffset = new THREE.Vector3(0, 1.05, 0.4);
        desiredLookOffset = new THREE.Vector3(0, 0.95, 20);
      } else if (this.cameraView === 'FAR') {
        desiredCamOffset = new THREE.Vector3(0, 4.2, -10.5);
        desiredLookOffset = new THREE.Vector3(0, 1.2, 10);
      }

      // Dynamic camera lag & FOV warp based on speed & nitro
      const nitroFovBonus = this.physics.nitroActive ? 12 : 0;
      this.targetFov = 62 + speedRatio * 18 + nitroFovBonus;
      this.camera.fov += (this.targetFov - this.camera.fov) * Math.min(1, 10 * delta);
      this.camera.updateProjectionMatrix();

      // Camera shake decay
      let shakeX = 0;
      let shakeY = 0;
      if (this.shakeIntensity > 0 && !settings.reducedMotion) {
        shakeX = (Math.random() - 0.5) * this.shakeIntensity * 0.45;
        shakeY = (Math.random() - 0.5) * this.shakeIntensity * 0.45;
        this.shakeIntensity = Math.max(0, this.shakeIntensity - 3.5 * delta);
      }

      // Smooth camera position damping
      const targetPos = new THREE.Vector3(
        carPos.x * 0.75 + desiredCamOffset.x + shakeX,
        carPos.y + desiredCamOffset.y + shakeY,
        carPos.z + desiredCamOffset.z
      );

      this.cameraTarget.lerp(targetPos, Math.min(1, 14 * delta));
      this.camera.position.copy(this.cameraTarget);

      const lookTarget = new THREE.Vector3(
        carPos.x + desiredLookOffset.x,
        carPos.y + desiredLookOffset.y,
        carPos.z + desiredLookOffset.z
      );
      this.cameraLookTarget.lerp(lookTarget, Math.min(1, 18 * delta));
      this.camera.lookAt(this.cameraLookTarget);
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  public applySettings(settings: GameSettings) {
    if (this.renderer) {
      if (settings.graphicsQuality === 'LOW') {
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
      } else if (settings.graphicsQuality === 'MEDIUM') {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      } else {
        this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      }
    }
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    try {
      this.renderer.dispose();
      if (this.canvas.parentElement) {
        this.canvas.parentElement.removeChild(this.canvas);
      }
    } catch {}
  }
}
