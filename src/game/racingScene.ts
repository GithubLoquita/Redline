/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraView, GameMode, GameSettings, VehicleConfig, WeatherType } from '../types';
import { CarComponents, createPlayerCar } from './carBuilder';
import { CityEnvironment } from './cityEnvironment';
import { PhysicsEngine } from './physicsEngine';
import { soundEngine } from '../audio/soundEngine';

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

  // Dynamic Weather System
  public activeWeather: 'CLEAR_NIGHT' | 'RAIN_STORM' | 'NEON_FOG' = 'CLEAR_NIGHT';
  public wetness = 0.0; // 0.0 (bone dry) to 1.0 (monsoon soaked)
  private targetWetness = 0.0;

  // Rain particle system
  public rainPoints: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;
  private rainCount = 1800;

  // Tire spray mist particle system
  public tireSprayPoints: THREE.Points | null = null;
  private tireSprayPositions: Float32Array | null = null;
  private tireSprayCount = 120;

  // Lightning system
  private lightningTimer = 8.0;
  private isFlashingLightning = false;
  private lightningFlashDuration = 0;

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

    // Adjust particle count for mobile/software GL performance
    if (this.isSoftwareGl || window.innerWidth < 768) {
      this.rainCount = 700;
      this.tireSprayCount = 50;
    }

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

    // Dynamic Weather Particles Initialization
    this.initWeatherParticles();

    this.setupShowroom();
    window.addEventListener('resize', this.onResize);
  }

  private initWeatherParticles() {
    // 1. Rain Drops Particles
    const rGeo = new THREE.BufferGeometry();
    const rPositions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      rPositions[i * 3] = (Math.random() - 0.5) * 36;
      rPositions[i * 3 + 1] = Math.random() * 26;
      rPositions[i * 3 + 2] = (Math.random() - 0.5) * 110;
    }

    rGeo.setAttribute('position', new THREE.BufferAttribute(rPositions, 3));
    this.rainPositions = rPositions;

    const rMat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.32,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(rGeo, rMat);
    this.scene.add(this.rainPoints);

    // 2. Tire Spray / Water Mist Particles
    const sGeo = new THREE.BufferGeometry();
    const sPositions = new Float32Array(this.tireSprayCount * 3);

    for (let i = 0; i < this.tireSprayCount; i++) {
      sPositions[i * 3] = (Math.random() - 0.5) * 2;
      sPositions[i * 3 + 1] = 0.1 + Math.random() * 0.8;
      sPositions[i * 3 + 2] = -2 - Math.random() * 6;
    }

    sGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3));
    this.tireSprayPositions = sPositions;

    const sMat = new THREE.PointsMaterial({
      color: 0xccddee,
      size: 0.45,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.tireSprayPoints = new THREE.Points(sGeo, sMat);
    this.scene.add(this.tireSprayPoints);
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

    // In showroom, clean dry reflection
    this.wetness = 0.0;
    this.city.setWetness(0.0);
    if (this.rainPoints) (this.rainPoints.material as THREE.PointsMaterial).opacity = 0;
    if (this.tireSprayPoints) (this.tireSprayPoints.material as THREE.PointsMaterial).opacity = 0;
    soundEngine.updateRain(0);
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

  public update(delta: number, settings: GameSettings, gameMode: GameMode = 'ENDLESS') {
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
      // 1. UPDATE DYNAMIC WEATHER SYSTEM
      this.updateWeather(delta, settings, gameMode);

      // 2. Update City chunk wrapping & speed particles
      const speedRatio = Math.min(1.0, this.physics.speed / this.physics.maxSpeed);
      this.city.update(this.physics.z, speedRatio);

      // 3. Headlight Beams tracking player
      const carPos = this.playerCar.rootGroup.position;
      this.headlightSpotL.position.set(carPos.x - 0.65, carPos.y + 0.5, carPos.z + 2.2);
      this.headlightSpotL.target.position.set(carPos.x - 0.65, 0.1, carPos.z + 45);

      this.headlightSpotR.position.set(carPos.x + 0.65, carPos.y + 0.5, carPos.z + 2.2);
      this.headlightSpotR.target.position.set(carPos.x + 0.65, 0.1, carPos.z + 45);

      // Directional light follows player smoothly
      this.dirLight.position.set(carPos.x + 15, 30, carPos.z + 10);
      this.dirLight.target.position.set(carPos.x, 0, carPos.z + 15);

      // 4. Camera Follow Dynamics
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

  private updateWeather(delta: number, settings: GameSettings, gameMode: GameMode) {
    // Determine active weather based on settings or difficulty
    let targetWeather: 'CLEAR_NIGHT' | 'RAIN_STORM' | 'NEON_FOG' = 'CLEAR_NIGHT';

    if (settings.weather === 'RAIN_STORM') {
      targetWeather = 'RAIN_STORM';
    } else if (settings.weather === 'NEON_FOG') {
      targetWeather = 'NEON_FOG';
    } else if (settings.weather === 'CLEAR_NIGHT') {
      targetWeather = 'CLEAR_NIGHT';
    } else {
      // AUTO_DIFFICULTY: Weather responds dynamically to game mode and distance
      if (settings.trafficDensity === 'HEAVY' || gameMode === 'CHECKPOINT') {
        // High difficulty challenge: Stormy rain
        targetWeather = 'RAIN_STORM';
      } else if (gameMode === 'FREE_DRIVE') {
        // Free drive: Cycles through clear and neon fog
        const cycle = Math.floor(this.physics.z / 1500) % 3;
        targetWeather = cycle === 1 ? 'NEON_FOG' : 'CLEAR_NIGHT';
      } else {
        // Endless & Time Attack: Dynamic transition every 1200m
        const cycle = Math.floor(this.physics.z / 1200) % 3;
        targetWeather = cycle === 1 ? 'RAIN_STORM' : cycle === 2 ? 'NEON_FOG' : 'CLEAR_NIGHT';
      }
    }

    this.activeWeather = targetWeather;

    // Target wetness
    if (this.activeWeather === 'RAIN_STORM') {
      this.targetWetness = 1.0;
    } else if (this.activeWeather === 'NEON_FOG') {
      this.targetWetness = 0.35;
    } else {
      this.targetWetness = 0.0;
    }

    // Smooth wetness transitions
    const wetRate = this.targetWetness > this.wetness ? 0.4 : 0.15;
    this.wetness += (this.targetWetness - this.wetness) * Math.min(1, wetRate * delta);

    // Apply wet road surface PBR shader properties
    this.city.setWetness(this.wetness);

    // Audio rain ambience
    soundEngine.updateRain(this.wetness);

    // Atmospheric Fog & Ambient Lighting
    const fog = this.scene.fog as THREE.FogExp2;
    if (this.activeWeather === 'RAIN_STORM') {
      fog.density = THREE.MathUtils.lerp(fog.density, 0.012, delta * 2);
      this.scene.background = new THREE.Color(0x06090e);
      fog.color.setHex(0x06090e);
      this.dirLight.intensity = this.isFlashingLightning ? 4.2 : 1.1;
      this.hemiLight.color.setHex(0x334466);
    } else if (this.activeWeather === 'NEON_FOG') {
      fog.density = THREE.MathUtils.lerp(fog.density, 0.015, delta * 2);
      this.scene.background = new THREE.Color(0x120716);
      fog.color.setHex(0x120716);
      this.dirLight.intensity = 1.3;
      this.hemiLight.color.setHex(0x663366);
    } else {
      fog.density = THREE.MathUtils.lerp(fog.density, 0.0075, delta * 2);
      this.scene.background = new THREE.Color(0x07070a);
      fog.color.setHex(0x07070a);
      this.dirLight.intensity = 1.6;
      this.hemiLight.color.setHex(0x4466aa);
    }

    // Lightning Flash Logic during Rain Storm
    if (this.activeWeather === 'RAIN_STORM') {
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        this.isFlashingLightning = true;
        this.lightningFlashDuration = 0.14;
        this.lightningTimer = 9.0 + Math.random() * 14.0;
        soundEngine.playThunder();
        if (!settings.reducedMotion) {
          this.triggerScreenShake(0.32);
        }
      }

      if (this.isFlashingLightning) {
        this.lightningFlashDuration -= delta;
        if (this.lightningFlashDuration <= 0) {
          this.isFlashingLightning = false;
        }
      }
    } else {
      this.isFlashingLightning = false;
    }

    // Update Rain Particles
    if (this.rainPoints && this.rainPositions && settings.particles) {
      const pos = this.rainPositions;
      const rMat = this.rainPoints.material as THREE.PointsMaterial;
      const pZ = this.physics.z;
      const speed = this.physics.speed;

      rMat.opacity = Math.max(0, this.wetness * 0.75);

      if (this.wetness > 0.05) {
        const fallSpeed = (36 + speed * 0.15) * delta;
        const slantSpeed = (speed * 0.35) * delta;

        for (let i = 0; i < this.rainCount; i++) {
          pos[i * 3 + 1] -= fallSpeed; // Downward Y
          pos[i * 3 + 2] -= slantSpeed; // Slanted relative to car

          // Wrap back to top around player's current Z
          if (pos[i * 3 + 1] < 0 || pos[i * 3 + 2] < pZ - 20) {
            pos[i * 3 + 1] = 22 + Math.random() * 8;
            pos[i * 3 + 2] = pZ + Math.random() * 85;
            pos[i * 3] = (Math.random() - 0.5) * 36;
          } else if (pos[i * 3 + 2] > pZ + 95) {
            pos[i * 3 + 2] = pZ - 10 + Math.random() * 20;
          }
        }
        this.rainPoints.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Update Tire Spray Mist Particles
    if (this.tireSprayPoints && this.tireSprayPositions && settings.particles) {
      const sMat = this.tireSprayPoints.material as THREE.PointsMaterial;
      const carPos = this.playerCar.rootGroup.position;
      const isSprayActive = this.wetness > 0.25 && this.physics.speed > 8;

      sMat.opacity = isSprayActive ? Math.min(0.55, (this.physics.speed / 50) * this.wetness * 0.5) : 0;

      if (isSprayActive) {
        const sPos = this.tireSprayPositions;
        for (let i = 0; i < this.tireSprayCount; i++) {
          // Spray moves backwards and spreads out
          sPos[i * 3 + 2] -= (this.physics.speed * 0.75 + 10) * delta;
          sPos[i * 3 + 1] += 0.4 * delta; // rises slightly

          // Reset spray behind wheels
          if (sPos[i * 3 + 2] < carPos.z - 12 || Math.random() < 0.08) {
            const side = i % 2 === 0 ? -0.95 : 0.95;
            sPos[i * 3] = carPos.x + side + (Math.random() - 0.5) * 0.4;
            sPos[i * 3 + 1] = 0.15 + Math.random() * 0.25;
            sPos[i * 3 + 2] = carPos.z - 1.6 - Math.random() * 0.5;
          }
        }
        this.tireSprayPoints.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  public applySettings(settings: GameSettings) {
    if (this.renderer) {
      if (settings.graphicsQuality === 'LOW') {
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
        this.rainCount = 400;
        this.tireSprayCount = 30;
      } else if (settings.graphicsQuality === 'MEDIUM') {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        this.renderer.shadowMap.enabled = !this.isSoftwareGl;
        this.rainCount = 1000;
        this.tireSprayCount = 70;
      } else {
        this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = !this.isSoftwareGl;
        this.rainCount = 1800;
        this.tireSprayCount = 120;
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
