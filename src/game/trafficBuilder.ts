/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { TrafficCar } from '../types';

export interface TrafficMeshInstance {
  group: THREE.Group;
  wheels: THREE.Group[];
  brakeLights: THREE.Mesh;
  type: 'sedan' | 'suv' | 'truck' | 'sport';
  width: number;
  length: number;
}

const TRAFFIC_COLORS = [
  0x2b303a, // Slate
  0x38404a, // Steel
  0xdfe0e2, // Pearl White
  0x1a1a1a, // Midnight Black
  0x0f4c81, // Classic Blue
  0x990000, // Crimson
  0x303030, // Charcoal
  0xffa500, // Cyber Amber
  0x107e7d, // Teal
];

export class TrafficBuilder {
  private wheelGeo: THREE.CylinderGeometry;
  private tireMat: THREE.MeshStandardMaterial;
  private rimMat: THREE.MeshStandardMaterial;
  private glassMat: THREE.MeshStandardMaterial;
  private headLightMat: THREE.MeshBasicMaterial;
  private tailLightMat: THREE.MeshBasicMaterial;
  private brakeLightActiveMat: THREE.MeshBasicMaterial;

  constructor() {
    this.wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 12);
    this.wheelGeo.rotateZ(Math.PI / 2);

    this.tireMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x05070a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });

    this.headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.tailLightMat = new THREE.MeshBasicMaterial({ color: 0xee2222 });
    this.brakeLightActiveMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  }

  private createWheels(width: number, length: number): { wheels: THREE.Group[]; wheelMeshes: THREE.Group[] } {
    const wheels: THREE.Group[] = [];
    const positions = [
      [-width * 0.48, 0.35, length * 0.32],
      [width * 0.48, 0.35, length * 0.32],
      [-width * 0.48, 0.35, -length * 0.32],
      [width * 0.48, 0.35, -length * 0.32],
    ];

    positions.forEach(([x, y, z]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(x, y, z);
      const tire = new THREE.Mesh(this.wheelGeo, this.tireMat);
      tire.castShadow = true;
      wGroup.add(tire);

      const capGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.23, 10);
      capGeo.rotateZ(Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, this.rimMat);
      wGroup.add(cap);

      wheels.push(wGroup);
    });

    return { wheels, wheelMeshes: wheels };
  }

  public createVehicle(type: 'sedan' | 'suv' | 'truck' | 'sport', colorHex?: number): TrafficMeshInstance {
    const group = new THREE.Group();
    const color = colorHex !== undefined ? colorHex : TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];

    const paintMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.75,
    });

    let width = 1.9;
    let length = 4.4;
    let height = 1.35;

    const wheelsList: THREE.Group[] = [];

    if (type === 'suv') {
      width = 2.05;
      length = 4.7;
      height = 1.65;

      // Lower body
      const bodyGeo = new THREE.BoxGeometry(width, 0.65, length);
      const body = new THREE.Mesh(bodyGeo, paintMat);
      body.position.y = 0.58;
      body.castShadow = true;
      group.add(body);

      // Cabin
      const cabinGeo = new THREE.BoxGeometry(width * 0.88, 0.62, length * 0.65);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      cabin.position.set(0, 1.15, -0.2);
      group.add(cabin);

      // Roof
      const roofGeo = new THREE.BoxGeometry(width * 0.84, 0.08, length * 0.62);
      const roof = new THREE.Mesh(roofGeo, paintMat);
      roof.position.set(0, 1.48, -0.2);
      group.add(roof);
    } else if (type === 'truck') {
      width = 2.2;
      length = 6.2;
      height = 2.3;

      // Cab
      const cabGeo = new THREE.BoxGeometry(width, 1.4, 2.0);
      const cab = new THREE.Mesh(cabGeo, paintMat);
      cab.position.set(0, 1.1, 1.9);
      cab.castShadow = true;
      group.add(cab);

      // Windshield
      const windGeo = new THREE.BoxGeometry(width * 0.9, 0.6, 0.1);
      const wind = new THREE.Mesh(windGeo, this.glassMat);
      wind.position.set(0, 1.4, 2.85);
      group.add(wind);

      // Cargo Container Box
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.6,
        metalness: 0.2,
      });
      const boxGeo = new THREE.BoxGeometry(width * 0.98, 1.8, 4.0);
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(0, 1.3, -0.9);
      box.castShadow = true;
      group.add(box);
    } else if (type === 'sport') {
      width = 1.95;
      length = 4.3;
      height = 1.15;

      // Low wedge body
      const bodyGeo = new THREE.BoxGeometry(width, 0.42, length);
      const body = new THREE.Mesh(bodyGeo, paintMat);
      body.position.y = 0.42;
      body.castShadow = true;
      group.add(body);

      // Sloped fastback cabin
      const cabinGeo = new THREE.BoxGeometry(width * 0.78, 0.42, length * 0.5);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      cabin.position.set(0, 0.75, -0.2);
      group.add(cabin);
    } else {
      // Standard Sedan
      width = 1.88;
      length = 4.4;
      height = 1.35;

      const bodyGeo = new THREE.BoxGeometry(width, 0.52, length);
      const body = new THREE.Mesh(bodyGeo, paintMat);
      body.position.y = 0.48;
      body.castShadow = true;
      group.add(body);

      const cabinGeo = new THREE.BoxGeometry(width * 0.82, 0.52, length * 0.55);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      cabin.position.set(0, 0.92, -0.15);
      group.add(cabin);

      const roofGeo = new THREE.BoxGeometry(width * 0.8, 0.06, length * 0.48);
      const roof = new THREE.Mesh(roofGeo, paintMat);
      roof.position.set(0, 1.2, -0.15);
      group.add(roof);
    }

    // Front headlights
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.08), this.headLightMat);
    headL.position.set(-width * 0.35, 0.5, length * 0.5);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.08), this.headLightMat);
    headR.position.set(width * 0.35, 0.5, length * 0.5);
    group.add(headL, headR);

    // Rear taillights & brake light
    const tailBarGeo = new THREE.BoxGeometry(width * 0.85, 0.08, 0.06);
    const brakeLights = new THREE.Mesh(tailBarGeo, this.tailLightMat);
    brakeLights.position.set(0, 0.6, -length * 0.5);
    group.add(brakeLights);

    // Wheels
    const { wheels } = this.createWheels(width, length);
    wheels.forEach((w) => {
      group.add(w);
      wheelsList.push(w);
    });

    return {
      group,
      wheels: wheelsList,
      brakeLights,
      type,
      width,
      length,
    };
  }
}
