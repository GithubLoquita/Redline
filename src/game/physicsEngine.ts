/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { TrafficBuilder, TrafficMeshInstance } from './trafficBuilder';
import { CarComponents } from './carBuilder';
import { GameSettings, NearMissEvent, PlayerStats, VehicleConfig } from '../types';
import { soundEngine } from '../audio/soundEngine';

export interface InputState {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
  nitro: boolean;
  // Analog values for Gamepad / Touch
  steerValue: number; // -1 to 1
  throttleValue: number; // 0 to 1
  brakeValue: number; // 0 to 1
}

export interface TrafficEntity {
  id: number;
  instance: TrafficMeshInstance;
  x: number;
  z: number;
  lane: number;
  speed: number; // m/s
  targetLane: number;
  laneChangeTimer: number;
  isChangingLane: boolean;
  hasNearMissed: boolean;
}

export class PhysicsEngine {
  // Player state
  public x = 0;
  public y = 0;
  public z = 0;
  public speed = 0; // m/s
  public steerAngle = 0; // Radians
  public yaw = 0;
  public roll = 0;
  public pitch = 0;
  public driftSlip = 0;

  // Limits & Constants
  public maxSpeed = 100; // m/s (~360 km/h)
  public acceleration = 35; // m/s^2
  public brakingForce = 45; // m/s^2
  public dragCoefficient = 0.003;
  public roadHalfWidth = 7.2;

  // Nitro
  public nitroActive = false;
  public nitroFuel = 100; // 0-100%
  public nitroMaxTime = 5.0; // Seconds

  // Stats
  public stats: PlayerStats = {
    speedKmh: 0,
    distanceMeters: 0,
    score: 0,
    highScore: 0,
    nearMisses: 0,
    nitroPercent: 100,
    healthPercent: 100,
    maxSpeedKmh: 0,
    multiplier: 1.0,
    timeLeft: 60,
    currentCheckpoint: 1,
    comboCount: 0,
  };

  // Traffic
  public traffic: TrafficEntity[] = [];
  private trafficBuilder: TrafficBuilder;
  private scene: THREE.Scene;
  private nextTrafficId = 1;
  private maxTrafficCount = 14;
  private lanePositions = [-5.4, -1.8, 1.8, 5.4];

  // Callback events
  public onNearMiss: ((event: NearMissEvent) => void) | null = null;
  public onCollision: ((damage: number) => void) | null = null;
  public onCheckpointReach: (() => void) | null = null;

  // Collision cooldown to prevent multi-hit on single impact
  private collisionCooldown = 0;
  private comboResetTimer = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.trafficBuilder = new TrafficBuilder();
  }

  public setVehicle(config: VehicleConfig) {
    this.maxSpeed = (config.topSpeed / 3.6);
    this.acceleration = 25 + (config.acceleration / 100) * 18;
    this.nitroMaxTime = config.nitroCapacity;
    this.nitroFuel = 100;
  }

  public reset(startZ = 0) {
    this.x = 0;
    this.y = 0;
    this.z = startZ;
    this.speed = 0;
    this.steerAngle = 0;
    this.yaw = 0;
    this.roll = 0;
    this.pitch = 0;
    this.driftSlip = 0;
    this.nitroActive = false;
    this.nitroFuel = 100;
    this.collisionCooldown = 0;
    this.comboResetTimer = 0;

    this.stats.speedKmh = 0;
    this.stats.distanceMeters = 0;
    this.stats.score = 0;
    this.stats.nearMisses = 0;
    this.stats.nitroPercent = 100;
    this.stats.healthPercent = 100;
    this.stats.maxSpeedKmh = 0;
    this.stats.multiplier = 1.0;
    this.stats.timeLeft = 60;
    this.stats.currentCheckpoint = 1;
    this.stats.comboCount = 0;

    // Clear all traffic
    this.traffic.forEach((t) => {
      this.scene.remove(t.instance.group);
    });
    this.traffic = [];
  }

  public update(
    dt: number,
    input: InputState,
    car: CarComponents,
    settings: GameSettings,
    gameMode: string,
  ) {
    // Clamp delta time to avoid large jumps
    const delta = Math.min(dt, 0.1);

    // 1. NITRO CONTROL
    const wantsNitro = (input.nitro || false) && this.nitroFuel > 0 && this.speed > 5;
    if (wantsNitro) {
      this.nitroActive = true;
      this.nitroFuel = Math.max(0, this.nitroFuel - (100 / this.nitroMaxTime) * delta);
      soundEngine.playNitroSound(true);
    } else {
      this.nitroActive = false;
      soundEngine.playNitroSound(false);
      // Gentle passive recharge
      this.nitroFuel = Math.min(100, this.nitroFuel + 3.0 * delta);
    }
    this.stats.nitroPercent = this.nitroFuel;

    // Show/hide nitro flames
    car.nitroEmitters.forEach((port) => {
      const flame = port.getObjectByName('NitroFlame') as THREE.Mesh;
      if (flame) {
        const mat = flame.material as THREE.MeshBasicMaterial;
        mat.opacity = this.nitroActive ? 0.95 : 0;
      }
    });

    // 2. ACCELERATION & BRAKING
    let targetAccel = 0;
    const accelInput = input.throttle ? 1 : input.throttleValue;
    const brakeInput = input.brake ? 1 : input.brakeValue;

    if (accelInput > 0) {
      let power = this.acceleration * accelInput;
      if (this.nitroActive) {
        power *= 1.45;
      }
      targetAccel += power;
    }

    if (brakeInput > 0) {
      targetAccel -= this.brakingForce * brakeInput;
    }

    // Aerodynamic Drag & Rolling Resistance
    const drag = this.dragCoefficient * this.speed * this.speed;
    const rollingResistance = 1.5;
    const netAccel = targetAccel - drag - (this.speed > 0 ? rollingResistance : 0);

    this.speed += netAccel * delta;

    // Speed limits
    const currentMaxSpeed = this.nitroActive ? this.maxSpeed * 1.25 : this.maxSpeed;
    if (this.speed > currentMaxSpeed) {
      this.speed = Math.max(currentMaxSpeed, this.speed - 15 * delta);
    }
    if (this.speed < 0) {
      this.speed = 0;
    }

    // 3. STEERING & DRIFT
    let steerInput = 0;
    if (input.steerLeft) steerInput -= 1;
    if (input.steerRight) steerInput += 1;
    if (Math.abs(input.steerValue) > 0.05) {
      steerInput = input.steerValue;
    }

    // Speed-dependent steering response: sharper at low speeds, stable at high speeds
    const speedRatio = Math.min(1.0, this.speed / this.maxSpeed);
    const steerSpeedScale = 1.2 - speedRatio * 0.45;
    const targetSteerAngle = steerInput * 0.45 * settings.steeringSensitivity * steerSpeedScale;

    // Smooth steering damp
    this.steerAngle += (targetSteerAngle - this.steerAngle) * Math.min(1, 14 * delta);

    // Drift / Handbrake
    const isDrifting = input.handbrake && this.speed > 15 && Math.abs(steerInput) > 0.3;
    if (isDrifting) {
      this.driftSlip += (1.0 - this.driftSlip) * 8 * delta;
      // Slight speed bleed during drift
      this.speed *= 1 - 0.08 * delta;
      // Add drift points
      this.stats.score += Math.round(50 * delta * this.stats.multiplier);
    } else {
      this.driftSlip += (0 - this.driftSlip) * 10 * delta;
    }

    soundEngine.updateTireSqueal(this.driftSlip * 0.8 + (Math.abs(steerInput) > 0.8 && speedRatio > 0.6 ? 0.35 : 0));

    // 4. LATERAL MOVEMENT & ROAD BOUNDS
    // Lateral velocity derived from steering angle + drift slip
    const lateralSpeed = this.speed * Math.sin(this.steerAngle) * (1.0 + this.driftSlip * 0.8);
    this.x += lateralSpeed * delta;

    // Road Edge Guardrail Collision
    if (Math.abs(this.x) > this.roadHalfWidth) {
      const sign = Math.sign(this.x);
      this.x = sign * this.roadHalfWidth;
      // Guardrail scrape penalty
      this.speed *= 0.94;
      soundEngine.playCollisionSound(0.4);
    }

    // Longitudinal movement (forward in Z)
    this.z += this.speed * Math.cos(this.steerAngle) * delta;

    // 5. CHASSIS DYNAMICS (ROLL & PITCH)
    // Lateral roll tilt
    const targetRoll = -this.steerAngle * 0.18 - (lateralSpeed / 20) * 0.08;
    this.roll += (targetRoll - this.roll) * 12 * delta;

    // Longitudinal pitch (braking nose-dive, acceleration squat)
    const targetPitch = (netAccel / 50) * 0.04;
    this.pitch += (targetPitch - this.pitch) * 10 * delta;

    // 6. UPDATE 3D CAR MESH
    car.rootGroup.position.set(this.x, this.y, this.z);
    car.rootGroup.rotation.y = this.steerAngle * 0.35;
    car.rootGroup.rotation.z = this.roll;
    car.rootGroup.rotation.x = this.pitch;

    // Steer front wheels
    car.frontLeftWheelGroup.rotation.y = this.steerAngle * 0.9;
    car.frontRightWheelGroup.rotation.y = this.steerAngle * 0.9;

    // Spin wheels according to road distance
    const wheelCircumference = 2 * Math.PI * 0.38;
    const wheelRotDelta = (this.speed * delta) / wheelCircumference;
    car.wheels.forEach((w) => {
      w.rotation.x += wheelRotDelta * Math.PI * 2;
    });

    // Brake lights illumination
    if (input.brake || input.brakeValue > 0.1) {
      car.brakeLightMaterial.emissiveIntensity = 4.0;
    } else {
      car.brakeLightMaterial.emissiveIntensity = 1.0;
    }

    // 7. STATS & SCORE UPDATES
    this.stats.speedKmh = Math.round(this.speed * 3.6);
    if (this.stats.speedKmh > this.stats.maxSpeedKmh) {
      this.stats.maxSpeedKmh = this.stats.speedKmh;
    }
    this.stats.distanceMeters += this.speed * delta;

    // Base continuous score scaled by speed & multiplier
    const speedScore = Math.max(0, (this.stats.speedKmh - 40) * 0.15);
    this.stats.score += Math.round(speedScore * delta * this.stats.multiplier);

    // Combo timer
    if (this.stats.comboCount > 0) {
      this.comboResetTimer -= delta;
      if (this.comboResetTimer <= 0) {
        this.stats.comboCount = 0;
        this.stats.multiplier = 1.0;
      }
    }

    // Timers for Time Attack & Checkpoint modes
    if (gameMode === 'TIME_ATTACK' || gameMode === 'CHECKPOINT') {
      this.stats.timeLeft -= delta;
      if (this.stats.timeLeft <= 0) {
        this.stats.timeLeft = 0;
      }
    }

    // Audio update
    soundEngine.updateMotor(speedRatio, accelInput > 0);

    // 8. TRAFFIC SIMULATION & COLLISIONS
    this.updateTraffic(delta, settings);

    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= delta;
    }
  }

  private updateTraffic(delta: number, settings: GameSettings) {
    // Traffic density target
    let targetCount = 10;
    if (settings.trafficDensity === 'LIGHT') targetCount = 6;
    if (settings.trafficDensity === 'HEAVY') targetCount = 14;

    // 1. Spawn traffic ahead if below density
    if (this.traffic.length < targetCount && Math.random() < 0.12) {
      this.spawnTrafficCar();
    }

    // 2. Update each traffic vehicle
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];

      // Move vehicle along its speed
      t.z += t.speed * delta;

      // Spin wheels
      const wheelRot = (t.speed * delta) / (2 * Math.PI * 0.35);
      t.instance.wheels.forEach((w) => {
        w.rotation.x += wheelRot * Math.PI * 2;
      });

      // Autonomous Lane Changing
      t.laneChangeTimer -= delta;
      if (t.laneChangeTimer <= 0 && !t.isChangingLane) {
        // Decide whether to switch lane
        if (Math.random() < 0.35) {
          const possibleLanes = [];
          if (t.lane > 0) possibleLanes.push(t.lane - 1);
          if (t.lane < this.lanePositions.length - 1) possibleLanes.push(t.lane + 1);

          if (possibleLanes.length > 0) {
            t.targetLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
            t.isChangingLane = true;
          }
        }
        t.laneChangeTimer = 6 + Math.random() * 8;
      }

      // Smoothly transition X to target lane
      if (t.isChangingLane) {
        const targetX = this.lanePositions[t.targetLane];
        const dir = Math.sign(targetX - t.x);
        t.x += dir * 2.2 * delta;

        // Turn indicator angle
        t.instance.group.rotation.y = dir * 0.08;

        if (Math.abs(t.x - targetX) < 0.1) {
          t.x = targetX;
          t.lane = t.targetLane;
          t.isChangingLane = false;
          t.instance.group.rotation.y = 0;
        }
      }

      t.instance.group.position.set(t.x, 0, t.z);

      // Check Collision with player
      const dx = Math.abs(t.x - this.x);
      const dz = Math.abs(t.z - this.z);

      const hitBoxX = (t.instance.width + 1.9) * 0.44;
      const hitBoxZ = (t.instance.length + 4.5) * 0.42;

      if (dx < hitBoxX && dz < hitBoxZ) {
        this.handleCollision(t);
      }

      // Check Near-Miss (close pass without collision at high speed)
      if (!t.hasNearMissed && this.stats.speedKmh > 110) {
        const nearMissLatThreshold = 2.45;
        const nearMissLongThreshold = (t.instance.length + 4.5) * 0.55;

        if (dx < nearMissLatThreshold && dz < nearMissLongThreshold) {
          t.hasNearMissed = true;
          this.handleNearMiss();
        }
      }

      // Despawn traffic left far behind (> 35m behind player) or absurdly far ahead (> 220m)
      if (t.z < this.z - 35 || t.z > this.z + 240) {
        this.scene.remove(t.instance.group);
        this.traffic.splice(i, 1);
      }
    }
  }

  private spawnTrafficCar() {
    const laneIndex = Math.floor(Math.random() * this.lanePositions.length);
    const laneX = this.lanePositions[laneIndex];

    // Spawn 70m to 160m ahead of player
    const spawnZ = this.z + 75 + Math.random() * 95;

    // Check if another vehicle is too close in the same lane
    const tooClose = this.traffic.some(
      (t) => t.lane === laneIndex && Math.abs(t.z - spawnZ) < 25
    );
    if (tooClose) return;

    const types: ('sedan' | 'suv' | 'truck' | 'sport')[] = ['sedan', 'sedan', 'suv', 'truck', 'sport'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const instance = this.trafficBuilder.createVehicle(chosenType);

    // Speed: 65 to 130 km/h (18 to 36 m/s)
    const baseSpeedKmh = 65 + Math.random() * 65;
    const speedMs = baseSpeedKmh / 3.6;

    instance.group.position.set(laneX, 0, spawnZ);
    this.scene.add(instance.group);

    this.traffic.push({
      id: this.nextTrafficId++,
      instance,
      x: laneX,
      z: spawnZ,
      lane: laneIndex,
      speed: speedMs,
      targetLane: laneIndex,
      laneChangeTimer: 4 + Math.random() * 8,
      isChangingLane: false,
      hasNearMissed: false,
    });
  }

  private handleCollision(target: TrafficEntity) {
    if (this.collisionCooldown > 0) return;
    this.collisionCooldown = 0.8;

    // Speed loss
    const impactSpeed = this.speed;
    this.speed = Math.max(5, this.speed * 0.45);

    // Lateral bounce
    const bounceDir = this.x > target.x ? 1 : -1;
    this.x += bounceDir * 1.5;

    // Damage & impact sound
    const damage = Math.min(40, Math.max(12, Math.round(impactSpeed * 0.6)));
    this.stats.healthPercent = Math.max(0, this.stats.healthPercent - damage);

    // Reset combo
    this.stats.comboCount = 0;
    this.stats.multiplier = 1.0;

    soundEngine.playCollisionSound(Math.min(1.5, impactSpeed / 30));

    if (this.onCollision) {
      this.onCollision(damage);
    }
  }

  private handleNearMiss() {
    this.stats.nearMisses += 1;
    this.stats.comboCount += 1;
    this.comboResetTimer = 4.5; // Combo window

    // Multiplier steps up with combo: x1 -> x1.5 -> x2 -> x2.5 -> max x4.0
    this.stats.multiplier = Math.min(4.0, 1.0 + this.stats.comboCount * 0.25);

    const bonusPoints = Math.round(150 * this.stats.multiplier);
    this.stats.score += bonusPoints;

    // Nitro refill reward!
    this.nitroFuel = Math.min(100, this.nitroFuel + 20);

    soundEngine.playNearMiss();

    if (this.onNearMiss) {
      this.onNearMiss({
        id: Math.random().toString(),
        text: `NEAR MISS +${bonusPoints}`,
        points: bonusPoints,
        time: Date.now(),
      });
    }
  }
}
