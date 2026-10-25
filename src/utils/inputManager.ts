/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InputState } from '../game/physicsEngine';

export class InputManager {
  public state: InputState = {
    throttle: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    nitro: false,
    steerValue: 0,
    throttleValue: 0,
    brakeValue: 0,
  };

  public onPauseToggle: (() => void) | null = null;
  public onRestart: (() => void) | null = null;
  public onCameraToggle: (() => void) | null = null;

  private keyMap: Record<string, boolean> = {};
  private gamepadConnected = false;

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('gamepadconnected', () => {
      this.gamepadConnected = true;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
    });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Avoid re-firing held keys repeatedly if not needed
    if (e.repeat && ['Escape', 'KeyR', 'KeyC'].includes(e.code)) return;

    this.keyMap[e.code] = true;

    if (e.code === 'Escape') {
      if (this.onPauseToggle) this.onPauseToggle();
    } else if (e.code === 'KeyR') {
      if (this.onRestart) this.onRestart();
    } else if (e.code === 'KeyC') {
      if (this.onCameraToggle) this.onCameraToggle();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keyMap[e.code] = false;
  };

  public update(): InputState {
    // 1. Keyboard Inputs
    const throttle = !!(this.keyMap['KeyW'] || this.keyMap['ArrowUp']);
    const brake = !!(this.keyMap['KeyS'] || this.keyMap['ArrowDown']);
    const steerLeft = !!(this.keyMap['KeyA'] || this.keyMap['ArrowLeft']);
    const steerRight = !!(this.keyMap['KeyD'] || this.keyMap['ArrowRight']);
    const handbrake = !!(this.keyMap['Space']);
    const nitro = !!(this.keyMap['ShiftLeft'] || this.keyMap['ShiftRight'] || this.keyMap['KeyN']);

    let steerValue = 0;
    if (steerLeft) steerValue -= 1;
    if (steerRight) steerValue += 1;

    let throttleValue = throttle ? 1 : 0;
    let brakeValue = brake ? 1 : 0;

    // 2. Poll Gamepad API
    try {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      if (gp) {
        // Left stick X
        const stickX = gp.axes[0];
        if (Math.abs(stickX) > 0.15) {
          steerValue = stickX;
        }

        // D-Pad
        if (gp.buttons[14]?.pressed) steerValue = -1;
        if (gp.buttons[15]?.pressed) steerValue = 1;

        // Triggers: RT (button 7) for throttle, LT (button 6) for brake
        const rt = gp.buttons[7]?.value || (gp.buttons[0]?.pressed ? 1 : 0);
        if (rt > 0.1) throttleValue = Math.max(throttleValue, rt);

        const lt = gp.buttons[6]?.value || (gp.buttons[1]?.pressed ? 1 : 0);
        if (lt > 0.1) brakeValue = Math.max(brakeValue, lt);

        // Nitro: X button (button 2) or LB (button 4)
        if (gp.buttons[2]?.pressed || gp.buttons[4]?.pressed) {
          this.state.nitro = true;
        }

        // Handbrake: RB (button 5) or A button (button 0)
        if (gp.buttons[5]?.pressed) {
          this.state.handbrake = true;
        }

        // Start / Pause button (button 9)
        if (gp.buttons[9]?.pressed) {
          if (this.onPauseToggle) this.onPauseToggle();
        }
      }
    } catch {}

    this.state.throttle = throttle || throttleValue > 0.1;
    this.state.brake = brake || brakeValue > 0.1;
    this.state.steerLeft = steerLeft || steerValue < -0.15;
    this.state.steerRight = steerRight || steerValue > 0.15;
    this.state.handbrake = handbrake || this.state.handbrake;
    this.state.nitro = nitro || this.state.nitro;
    this.state.steerValue = steerValue;
    this.state.throttleValue = throttleValue;
    this.state.brakeValue = brakeValue;

    return this.state;
  }

  // Mobile Touch Helpers
  public setMobileInput(key: keyof InputState, value: boolean | number) {
    (this.state as any)[key] = value;
  }

  public dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
