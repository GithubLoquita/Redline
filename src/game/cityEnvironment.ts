/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface HighwayChunk {
  group: THREE.Group;
  z: number;
}

export class CityEnvironment {
  public scene: THREE.Scene;
  public highwayChunks: HighwayChunk[] = [];
  public chunkLength = 160;
  public numChunks = 4;
  public roadWidth = 15.5;
  public laneWidth = 3.6;
  public laneCount = 4;

  // Materials
  public roadMaterial: THREE.MeshPhysicalMaterial;
  private markMaterial: THREE.MeshBasicMaterial;
  private yellowLineMaterial: THREE.MeshBasicMaterial;
  private guardrailMaterial: THREE.MeshStandardMaterial;
  private buildingMaterials: THREE.MeshStandardMaterial[] = [];
  private glassBuildingMaterial: THREE.MeshPhysicalMaterial;
  private neonSignMaterials: THREE.MeshBasicMaterial[] = [];

  // Wind Particles
  public speedParticles: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;
  private particleCount = 200;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Procedural Asphalt Texture
    const asphaltCanvas = document.createElement('canvas');
    asphaltCanvas.width = 512;
    asphaltCanvas.height = 512;
    const actx = asphaltCanvas.getContext('2d')!;
    actx.fillStyle = '#151619';
    actx.fillRect(0, 0, 512, 512);

    // Subtle road grit & subtle puddle contours
    for (let i = 0; i < 4000; i++) {
      const g = 25 + Math.random() * 25;
      actx.fillStyle = `rgb(${g}, ${g}, ${g})`;
      actx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const roadTexture = new THREE.CanvasTexture(asphaltCanvas);
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, 16);

    this.roadMaterial = new THREE.MeshPhysicalMaterial({
      map: roadTexture,
      roughness: 0.82,
      metalness: 0.08,
      clearcoat: 0.0,
      clearcoatRoughness: 0.5,
      reflectivity: 0.5,
    });

    this.markMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.yellowLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    this.guardrailMaterial = new THREE.MeshStandardMaterial({
      color: 0x555c66,
      metalness: 0.85,
      roughness: 0.3,
    });

    this.glassBuildingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a1420,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      reflectivity: 0.9,
    });

    this.initBuildingTextures();
    this.initNeonSigns();
    this.initSpeedParticles();
    this.createHighwayChunks();
  }

  private initBuildingTextures() {
    // Generate 3 procedural skyscraper window grid textures
    const colors = ['#00f0ff', '#ffb020', '#ffffff', '#ff2020'];

    for (let b = 0; b < 3; b++) {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 256;
      bCanvas.height = 512;
      const bctx = bCanvas.getContext('2d')!;

      bctx.fillStyle = '#08080c';
      bctx.fillRect(0, 0, 256, 512);

      // Window grid
      const cols = 8;
      const rows = 24;
      const wWidth = 18;
      const wHeight = 12;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isLit = Math.random() > 0.45;
          if (isLit) {
            const glowColor = colors[(r + c + b) % colors.length];
            bctx.fillStyle = glowColor;
            bctx.fillRect(c * 32 + 8, r * 20 + 6, wWidth, wHeight);
          } else {
            bctx.fillStyle = '#11131a';
            bctx.fillRect(c * 32 + 8, r * 20 + 6, wWidth, wHeight);
          }
        }
      }

      const tex = new THREE.CanvasTexture(bCanvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.85,
        roughness: 0.4,
        metalness: 0.5,
      });
      this.buildingMaterials.push(mat);
    }
  }

  private initNeonSigns() {
    const signs = [
      { text: 'REDLINE METROPOLIS', color: '#FF2020' },
      { text: 'CYBER EXPWY 101', color: '#00F0FF' },
      { text: 'SPEED ENFORCED BY DRONES', color: '#FFAA00' },
      { text: 'ANIX TECH DISTRICT', color: '#FF2060' },
    ];

    signs.forEach((s) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, 512, 128);

      ctx.strokeStyle = s.color;
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 116);

      ctx.font = 'bold 32px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, 256, 64);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({ map: tex });
      this.neonSignMaterials.push(mat);
    });
  }

  private initSpeedParticles() {
    const count = this.particleCount;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = 0.5 + Math.random() * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particlePositions = positions;

    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.25,
      transparent: true,
      opacity: 0.4,
    });

    this.speedParticles = new THREE.Points(geo, pMat);
    this.scene.add(this.speedParticles);
  }

  private createHighwayChunks() {
    for (let i = 0; i < this.numChunks; i++) {
      const chunkGroup = new THREE.Group();
      const zOffset = (i - 1) * this.chunkLength;

      this.buildChunkGeometry(chunkGroup);
      chunkGroup.position.z = zOffset;

      this.scene.add(chunkGroup);
      this.highwayChunks.push({ group: chunkGroup, z: zOffset });
    }
  }

  private buildChunkGeometry(group: THREE.Group) {
    const len = this.chunkLength;

    // 1. Asphalt Road Plane
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, len);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, this.roadMaterial);
    road.position.y = 0;
    road.receiveShadow = true;
    group.add(road);

    // 2. Yellow solid edge lines
    const edgeLineGeo = new THREE.PlaneGeometry(0.25, len);
    edgeLineGeo.rotateX(-Math.PI / 2);
    const leftEdge = new THREE.Mesh(edgeLineGeo, this.yellowLineMaterial);
    leftEdge.position.set(-this.roadWidth * 0.48, 0.01, 0);
    const rightEdge = new THREE.Mesh(edgeLineGeo, this.yellowLineMaterial);
    rightEdge.position.set(this.roadWidth * 0.48, 0.01, 0);
    group.add(leftEdge, rightEdge);

    // 3. White dashed lane markings
    const dashLength = 4;
    const dashGap = 6;
    const numDashes = Math.floor(len / (dashLength + dashGap));

    // 3 divider lines for 4 lanes
    const laneDividers = [
      -this.roadWidth * 0.25,
      0,
      this.roadWidth * 0.25,
    ];

    const dashGeo = new THREE.PlaneGeometry(0.2, dashLength);
    dashGeo.rotateX(-Math.PI / 2);

    laneDividers.forEach((xPos) => {
      for (let d = 0; d < numDashes; d++) {
        const dash = new THREE.Mesh(dashGeo, this.markMaterial);
        const zPos = -len * 0.5 + d * (dashLength + dashGap) + dashLength * 0.5;
        dash.position.set(xPos, 0.015, zPos);
        group.add(dash);
      }
    });

    // 4. Guardrails & Safety Barriers
    const railHeight = 0.85;
    const railGeo = new THREE.BoxGeometry(0.3, railHeight, len);
    const leftRail = new THREE.Mesh(railGeo, this.guardrailMaterial);
    leftRail.position.set(-this.roadWidth * 0.52 - 0.2, railHeight * 0.5, 0);
    const rightRail = new THREE.Mesh(railGeo, this.guardrailMaterial);
    rightRail.position.set(this.roadWidth * 0.52 + 0.2, railHeight * 0.5, 0);
    group.add(leftRail, rightRail);

    // Guardrail red/white reflectors
    const reflectorCount = Math.floor(len / 12);
    const refGeo = new THREE.BoxGeometry(0.08, 0.12, 0.2);
    const refRedMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
    const refWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let r = 0; r < reflectorCount; r++) {
      const zRef = -len * 0.5 + r * 12 + 6;
      const refL = new THREE.Mesh(refGeo, refRedMat);
      refL.position.set(-this.roadWidth * 0.52 + 0.05, railHeight * 0.7, zRef);
      const refR = new THREE.Mesh(refGeo, refWhiteMat);
      refR.position.set(this.roadWidth * 0.52 - 0.05, railHeight * 0.7, zRef);
      group.add(refL, refR);
    }

    // 5. Street Light Poles (Modern arched LED fixtures)
    const poleCount = Math.floor(len / 32);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    const lampEmissiveMat = new THREE.MeshBasicMaterial({ color: 0xe6f0ff });

    for (let p = 0; p < poleCount; p++) {
      const zPole = -len * 0.5 + p * 32 + 16;
      [-1, 1].forEach((side) => {
        const poleGroup = new THREE.Group();
        const xSide = side * (this.roadWidth * 0.5 + 1.2);
        poleGroup.position.set(xSide, 0, zPole);

        // Vertical pole
        const vPoleGeo = new THREE.CylinderGeometry(0.12, 0.15, 6.5, 8);
        const vPole = new THREE.Mesh(vPoleGeo, poleMat);
        vPole.position.y = 3.25;
        poleGroup.add(vPole);

        // Horizontal arm
        const hArmGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8);
        hArmGeo.rotateZ(Math.PI / 2);
        const hArm = new THREE.Mesh(hArmGeo, poleMat);
        hArm.position.set(-side * 0.9, 6.4, 0);
        poleGroup.add(hArm);

        // Lamp head
        const lampGeo = new THREE.BoxGeometry(0.4, 0.1, 0.8);
        const lamp = new THREE.Mesh(lampGeo, lampEmissiveMat);
        lamp.position.set(-side * 1.8, 6.35, 0);
        poleGroup.add(lamp);

        group.add(poleGroup);
      });
    }

    // 6. Overhead Highway Gantry Sign (1 per chunk)
    const gantry = new THREE.Group();
    gantry.position.set(0, 0, 0);

    const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 7.5, 8);
    const postL = new THREE.Mesh(postGeo, poleMat);
    postL.position.set(-this.roadWidth * 0.54, 3.75, 0);
    const postR = new THREE.Mesh(postGeo, poleMat);
    postR.position.set(this.roadWidth * 0.54, 3.75, 0);

    const beamGeo = new THREE.BoxGeometry(this.roadWidth + 1.2, 0.4, 0.4);
    const beam = new THREE.Mesh(beamGeo, poleMat);
    beam.position.set(0, 7.4, 0);

    // Sign Board
    const signGeo = new THREE.PlaneGeometry(10, 2.5);
    const signMat = this.neonSignMaterials[Math.floor(Math.random() * this.neonSignMaterials.length)];
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 6.2, 0.22);

    gantry.add(postL, postR, beam, signMesh);
    group.add(gantry);

    // 7. Procedural City Skyscrapers (Flanking the highway on both sides)
    const numBuildings = 14;
    for (let b = 0; b < numBuildings; b++) {
      const side = b % 2 === 0 ? -1 : 1;
      const bDist = this.roadWidth * 0.5 + 6 + Math.random() * 28;
      const bZ = -len * 0.5 + (b / numBuildings) * len + (Math.random() - 0.5) * 10;
      const bWidth = 14 + Math.random() * 18;
      const bDepth = 14 + Math.random() * 18;
      const bHeight = 35 + Math.random() * 90;

      const isGlass = Math.random() > 0.65;
      const mat = isGlass
        ? this.glassBuildingMaterial
        : this.buildingMaterials[Math.floor(Math.random() * this.buildingMaterials.length)];

      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMesh = new THREE.Mesh(bGeo, mat);
      bMesh.position.set(side * bDist, bHeight * 0.5, bZ);
      group.add(bMesh);

      // Rooftop hazard beacon on tall buildings
      if (bHeight > 60) {
        const beaconGeo = new THREE.SphereGeometry(0.4, 6, 6);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0020 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(side * bDist, bHeight + 0.5, bZ);
        group.add(beacon);
      }
    }
  }

  public update(playerZ: number, playerSpeedRatio: number) {
    // Check if the farthest chunk is behind player; wrap it forward
    const halfSpan = (this.numChunks * this.chunkLength) / 2;

    this.highwayChunks.forEach((chunk) => {
      // If chunk is far behind the player (player drives in positive Z direction)
      if (chunk.group.position.z < playerZ - this.chunkLength * 1.5) {
        // Move to front
        chunk.group.position.z += this.numChunks * this.chunkLength;
      }
    });

    // Update speed particles
    if (this.speedParticles && this.particlePositions) {
      const pos = this.particlePositions;
      const speed = 20 + playerSpeedRatio * 80;

      for (let i = 0; i < this.particleCount; i++) {
        // Particles stream backwards toward player
        pos[i * 3 + 2] -= speed * 0.016;

        // Reset particle ahead of player if behind
        if (pos[i * 3 + 2] < playerZ - 10) {
          pos[i * 3 + 2] = playerZ + 90 + Math.random() * 30;
          pos[i * 3] = (Math.random() - 0.5) * 18;
          pos[i * 3 + 1] = 0.5 + Math.random() * 3.5;
        }
      }
      this.speedParticles.geometry.attributes.position.needsUpdate = true;

      // Opacity and size scale with speed
      const mat = this.speedParticles.material as THREE.PointsMaterial;
      mat.opacity = 0.2 + playerSpeedRatio * 0.65;
      mat.size = 0.2 + playerSpeedRatio * 0.4;
    }
  }

  public setWetness(amount: number) {
    const clamped = Math.max(0, Math.min(1, amount));
    // As wetness increases, asphalt becomes darker, mirror-reflective and glossy
    this.roadMaterial.roughness = THREE.MathUtils.lerp(0.82, 0.14, clamped);
    this.roadMaterial.clearcoat = THREE.MathUtils.lerp(0.0, 1.0, clamped);
    this.roadMaterial.clearcoatRoughness = THREE.MathUtils.lerp(0.5, 0.05, clamped);
    this.roadMaterial.metalness = THREE.MathUtils.lerp(0.08, 0.45, clamped);
    this.roadMaterial.needsUpdate = true;
  }
}
