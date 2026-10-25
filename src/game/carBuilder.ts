/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VehicleConfig } from '../types';

export const VEHICLE_PRESETS: VehicleConfig[] = [
  {
    id: 'hyperion',
    name: 'APEX HYPERION',
    subtitle: 'Track-Focused Hyper-Roadster',
    acceleration: 95,
    topSpeed: 380, // km/h
    handling: 90,
    nitroCapacity: 5.5,
    bodyColor: '#FF2020',
    accentColor: '#111111',
    description: 'Quad-motor electric powertrain with active ground-effect aero and instant torque response.',
  },
  {
    id: 'pulse',
    name: 'CYBERPULSE GT',
    subtitle: 'Cybernetic Endurance Supercar',
    acceleration: 88,
    topSpeed: 410,
    handling: 82,
    nitroCapacity: 7.0,
    bodyColor: '#C8CDD0',
    accentColor: '#FF2020',
    description: 'Angular composite exoskeleton engineered for high-speed slipstream stability and raw straight-line speed.',
  },
  {
    id: 'vortex',
    name: 'VORTEX PLAID',
    subtitle: 'Grand Touring Aerodynamic Flagship',
    acceleration: 92,
    topSpeed: 360,
    handling: 96,
    nitroCapacity: 6.0,
    bodyColor: '#0E0E10',
    accentColor: '#FF2020',
    description: 'Triple-motor torque vectoring with ultra-low drag coefficient and supreme drift recovery.',
  },
];

export interface CarComponents {
  rootGroup: THREE.Group;
  bodyMesh: THREE.Mesh;
  bodyMaterial: THREE.MeshStandardMaterial;
  wheels: THREE.Group[];
  frontLeftWheelGroup: THREE.Group;
  frontRightWheelGroup: THREE.Group;
  rearLeftWheelGroup: THREE.Group;
  rearRightWheelGroup: THREE.Group;
  tailLightMaterial: THREE.MeshStandardMaterial;
  headLightMaterial: THREE.MeshStandardMaterial;
  brakeLightMaterial: THREE.MeshStandardMaterial;
  nitroEmitters: THREE.Group[];
  shadowMesh: THREE.Mesh;
}

export function createPlayerCar(vehicleId: string, customColor?: string): CarComponents {
  const root = new THREE.Group();
  root.name = 'PlayerCar';

  const config = VEHICLE_PRESETS.find((v) => v.id === vehicleId) || VEHICLE_PRESETS[0];
  const primaryColor = new THREE.Color(customColor || config.bodyColor);
  const darkCarbonColor = new THREE.Color(0x151618);
  const rimColor = new THREE.Color(0xd0d5dd);
  const caliperColor = new THREE.Color(0xff2020);

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.85,
    roughness: 0.18,
    envMapIntensity: 1.5,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: darkCarbonColor,
    metalness: 0.2,
    roughness: 0.7,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x05070a,
    metalness: 0.95,
    roughness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x181818,
    metalness: 0.1,
    roughness: 0.85,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: rimColor,
    metalness: 0.9,
    roughness: 0.25,
  });

  const caliperMaterial = new THREE.MeshStandardMaterial({
    color: caliperColor,
    metalness: 0.4,
    roughness: 0.3,
  });

  const headLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x88ccff,
    emissiveIntensity: 2.0,
    metalness: 0.1,
    roughness: 0.1,
  });

  const tailLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa0000,
    emissive: 0xff2020,
    emissiveIntensity: 1.2,
    metalness: 0.1,
    roughness: 0.2,
  });

  const brakeLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff1010,
    emissive: 0xff0000,
    emissiveIntensity: 2.5,
    metalness: 0.1,
    roughness: 0.1,
  });

  const interiorMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.8,
  });

  // 1. CHASSIS / LOWER BODY
  // Stylized aerodynamic electric sports car silhouette
  const bodyGroup = new THREE.Group();

  let bodyMesh: THREE.Mesh;

  if (vehicleId === 'pulse') {
    // Angular cyber design with sharp facets
    const lowerShape = new THREE.Shape();
    lowerShape.moveTo(-0.95, -2.2);
    lowerShape.lineTo(0.95, -2.2);
    lowerShape.lineTo(1.05, -0.6);
    lowerShape.lineTo(1.0, 1.2);
    lowerShape.lineTo(0.85, 2.2);
    lowerShape.lineTo(0.5, 2.45);
    lowerShape.lineTo(-0.5, 2.45);
    lowerShape.lineTo(-0.85, 2.2);
    lowerShape.lineTo(-1.0, 1.2);
    lowerShape.lineTo(-1.05, -0.6);
    lowerShape.closePath();

    const extrudeSettings = {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };
    const bodyGeo = new THREE.ExtrudeGeometry(lowerShape, extrudeSettings);
    bodyGeo.rotateX(-Math.PI / 2);
    bodyGeo.center();
    bodyGeo.translate(0, 0.42, 0);
    bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyGroup.add(bodyMesh);
  } else {
    // Hyperion & Vortex: Sleek curved sports car profile
    const lowerShape = new THREE.Shape();
    lowerShape.moveTo(-0.95, -2.25);
    lowerShape.quadraticCurveTo(-1.05, -1.0, -1.02, 0.2);
    lowerShape.quadraticCurveTo(-1.0, 1.4, -0.8, 2.2);
    lowerShape.quadraticCurveTo(-0.4, 2.45, 0, 2.48);
    lowerShape.quadraticCurveTo(0.4, 2.45, 0.8, 2.2);
    lowerShape.quadraticCurveTo(1.0, 1.4, 1.02, 0.2);
    lowerShape.quadraticCurveTo(1.05, -1.0, 0.95, -2.25);
    lowerShape.quadraticCurveTo(0, -2.3, -0.95, -2.25);

    const extrudeSettings = {
      depth: 0.48,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.09,
      bevelThickness: 0.09,
    };
    const bodyGeo = new THREE.ExtrudeGeometry(lowerShape, extrudeSettings);
    bodyGeo.rotateX(-Math.PI / 2);
    bodyGeo.center();
    bodyGeo.translate(0, 0.42, 0);
    bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyGroup.add(bodyMesh);
  }

  // 2. FRONT HOOD & SPLITTER
  const splitterGeo = new THREE.BoxGeometry(2.05, 0.06, 0.8);
  const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitter.position.set(0, 0.16, 2.0);
  bodyGroup.add(splitter);

  // Side skirts
  const skirtGeo = new THREE.BoxGeometry(0.12, 0.12, 2.6);
  const leftSkirt = new THREE.Mesh(skirtGeo, carbonMaterial);
  leftSkirt.position.set(-1.0, 0.18, 0.1);
  const rightSkirt = new THREE.Mesh(skirtGeo, carbonMaterial);
  rightSkirt.position.set(1.0, 0.18, 0.1);
  bodyGroup.add(leftSkirt, rightSkirt);

  // 3. CABIN & PANORAMIC GLASS COCKPIT
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.7, -1.4);
  cabinShape.lineTo(-0.75, -0.2);
  cabinShape.lineTo(-0.65, 0.9);
  cabinShape.lineTo(-0.4, 1.25);
  cabinShape.lineTo(0.4, 1.25);
  cabinShape.lineTo(0.65, 0.9);
  cabinShape.lineTo(0.75, -0.2);
  cabinShape.lineTo(0.7, -1.4);
  cabinShape.closePath();

  const cabinExtrude = {
    depth: 0.42,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  };
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, cabinExtrude);
  cabinGeo.rotateX(-Math.PI / 2);
  cabinGeo.center();
  cabinGeo.translate(0, 0.82, -0.2);

  const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  // Interior seats & Tesla-style center display silhouette
  const seatGeo = new THREE.BoxGeometry(0.42, 0.45, 0.45);
  const seatL = new THREE.Mesh(seatGeo, interiorMaterial);
  seatL.position.set(-0.35, 0.65, -0.25);
  const seatR = new THREE.Mesh(seatGeo, interiorMaterial);
  seatR.position.set(0.35, 0.65, -0.25);
  bodyGroup.add(seatL, seatR);

  const screenGeo = new THREE.BoxGeometry(0.3, 0.18, 0.02);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.72, 0.22);
  screen.rotation.x = -0.3;
  bodyGroup.add(screen);

  // 4. REAR SPOILER / DIFFUSER
  const diffuserGeo = new THREE.BoxGeometry(1.8, 0.15, 0.4);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuser.position.set(0, 0.2, -2.15);
  bodyGroup.add(diffuser);

  // Active Aero Wing / Lip
  const wingGeo = new THREE.BoxGeometry(1.7, 0.04, 0.35);
  const wing = new THREE.Mesh(wingGeo, carbonMaterial);
  wing.position.set(0, 0.85, -2.05);
  wing.rotation.x = 0.06;

  const wingSupportGeo = new THREE.BoxGeometry(0.04, 0.25, 0.15);
  const suppL = new THREE.Mesh(wingSupportGeo, carbonMaterial);
  suppL.position.set(-0.55, 0.72, -2.0);
  const suppR = new THREE.Mesh(wingSupportGeo, carbonMaterial);
  suppR.position.set(0.55, 0.72, -2.0);
  bodyGroup.add(wing, suppL, suppR);

  // 5. LIGHTING: CYBER LED LIGHTS & REAR LIGHTBAR
  // Front Headlights
  const headLightGeo = new THREE.BoxGeometry(0.45, 0.06, 0.15);
  const headL = new THREE.Mesh(headLightGeo, headLightMaterial);
  headL.position.set(-0.65, 0.45, 2.3);
  headL.rotation.y = 0.25;
  const headR = new THREE.Mesh(headLightGeo, headLightMaterial);
  headR.position.set(0.65, 0.45, 2.3);
  headR.rotation.y = -0.25;
  bodyGroup.add(headL, headR);

  // Full-width continuous rear cyber light bar
  const tailBarGeo = new THREE.BoxGeometry(1.75, 0.07, 0.05);
  const tailBar = new THREE.Mesh(tailBarGeo, tailLightMaterial);
  tailBar.position.set(0, 0.62, -2.25);
  bodyGroup.add(tailBar);

  // Rear brake lights (sides)
  const brakeLightGeo = new THREE.BoxGeometry(0.35, 0.06, 0.05);
  const brakeL = new THREE.Mesh(brakeLightGeo, brakeLightMaterial);
  brakeL.position.set(-0.7, 0.62, -2.26);
  const brakeR = new THREE.Mesh(brakeLightGeo, brakeLightMaterial);
  brakeR.position.set(0.7, 0.62, -2.26);
  bodyGroup.add(brakeL, brakeR);

  // Side mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.2, 0.06, 0.12);
  const mirrorL = new THREE.Mesh(mirrorGeo, carbonMaterial);
  mirrorL.position.set(-1.05, 0.75, 0.6);
  const mirrorR = new THREE.Mesh(mirrorGeo, carbonMaterial);
  mirrorR.position.set(1.05, 0.75, 0.6);
  bodyGroup.add(mirrorL, mirrorR);

  // 6. NITRO EXHAUST PORTS
  const nitroEmitters: THREE.Group[] = [];
  const nitroPortL = new THREE.Group();
  nitroPortL.position.set(-0.4, 0.35, -2.26);
  const nitroPortR = new THREE.Group();
  nitroPortR.position.set(0.4, 0.35, -2.26);

  const ringGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.9,
    roughness: 0.2,
  });
  const portL = new THREE.Mesh(ringGeo, ringMat);
  const portR = new THREE.Mesh(ringGeo, ringMat);
  nitroPortL.add(portL);
  nitroPortR.add(portR);

  // Nitro flame cone meshes (visible during boost)
  const flameGeo = new THREE.ConeGeometry(0.12, 0.75, 12);
  flameGeo.rotateX(-Math.PI / 2);
  flameGeo.translate(0, 0, -0.38);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0,
  });
  const flameL = new THREE.Mesh(flameGeo, flameMat);
  const flameR = new THREE.Mesh(flameGeo, flameMat);
  flameL.name = 'NitroFlame';
  flameR.name = 'NitroFlame';
  nitroPortL.add(flameL);
  nitroPortR.add(flameR);

  bodyGroup.add(nitroPortL, nitroPortR);
  nitroEmitters.push(nitroPortL, nitroPortR);

  root.add(bodyGroup);

  // 7. DETAILED WHEELS (4 composite wheels with rotating rims & stationary brake calipers)
  const wheelRadius = 0.38;
  const wheelWidth = 0.28;

  function createWheel(): { outerGroup: THREE.Group; spinGroup: THREE.Group } {
    const outerGroup = new THREE.Group(); // Steers (turns on Y axis)
    const spinGroup = new THREE.Group(); // Spins (rotates on X axis)

    // Tire
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMaterial);
    tire.castShadow = true;
    spinGroup.add(tire);

    // Rim Outer Ring
    const rimRingGeo = new THREE.TorusGeometry(wheelRadius * 0.75, 0.03, 12, 24);
    rimRingGeo.rotateY(Math.PI / 2);
    const rimRing = new THREE.Mesh(rimRingGeo, rimMaterial);
    spinGroup.add(rimRing);

    // Rim Spokes (5 twin cyber spokes)
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(0.04, wheelRadius * 0.75, 0.05);
      const spoke = new THREE.Mesh(spokeGeo, rimMaterial);
      spoke.position.y = Math.cos(angle) * (wheelRadius * 0.38);
      spoke.position.z = Math.sin(angle) * (wheelRadius * 0.38);
      spoke.rotation.x = -angle;
      spinGroup.add(spoke);
    }

    // Brake Disc
    const discGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, 0.04, 20);
    discGeo.rotateZ(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.95,
      roughness: 0.2,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    spinGroup.add(disc);

    // Red Brake Caliper (stationary, sits on outerGroup)
    const caliperGeo = new THREE.BoxGeometry(0.12, 0.16, 0.14);
    const caliper = new THREE.Mesh(caliperGeo, caliperMaterial);
    caliper.position.set(0, wheelRadius * 0.32, 0.1);
    outerGroup.add(caliper);

    outerGroup.add(spinGroup);
    return { outerGroup, spinGroup };
  }

  const frontLeft = createWheel();
  frontLeft.outerGroup.position.set(-0.95, wheelRadius, 1.45);

  const frontRight = createWheel();
  frontRight.outerGroup.position.set(0.95, wheelRadius, 1.45);

  const rearLeft = createWheel();
  rearLeft.outerGroup.position.set(-0.96, wheelRadius, -1.35);

  const rearRight = createWheel();
  rearRight.outerGroup.position.set(0.96, wheelRadius, -1.35);

  root.add(frontLeft.outerGroup, frontRight.outerGroup, rearLeft.outerGroup, rearRight.outerGroup);

  // 8. CONTACT GROUND SHADOW PLANE
  // Soft radial blur texture generated via canvas
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 256;
  const shadowCtx = shadowCanvas.getContext('2d')!;
  const gradient = shadowCtx.createRadialGradient(64, 128, 10, 64, 128, 64);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  shadowCtx.fillStyle = gradient;
  shadowCtx.fillRect(0, 0, 128, 256);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(3.0, 5.8);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02; // Elevated slightly to avoid Z-fighting
  root.add(shadowMesh);

  return {
    rootGroup: root,
    bodyMesh,
    bodyMaterial,
    wheels: [
      frontLeft.spinGroup,
      frontRight.spinGroup,
      rearLeft.spinGroup,
      rearRight.spinGroup,
    ],
    frontLeftWheelGroup: frontLeft.outerGroup,
    frontRightWheelGroup: frontRight.outerGroup,
    rearLeftWheelGroup: rearLeft.outerGroup,
    rearRightWheelGroup: rearRight.outerGroup,
    tailLightMaterial,
    headLightMaterial,
    brakeLightMaterial,
    nitroEmitters,
    shadowMesh,
  };
}
