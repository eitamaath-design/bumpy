// Input Manager handling Keyboard, Gamepad API, and Virtual Touch Controls

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  restart: boolean;
  pause: boolean;
  muteMusic: boolean;
  muteSound: boolean;
}

export class InputManager {
  private state: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    restart: false,
    pause: false,
    muteMusic: false,
    muteSound: false
  };

  private virtualLeft: boolean = false;
  private virtualRight: boolean = false;
  private virtualUp: boolean = false;
  private virtualDown: boolean = false;

  private keyMap: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keyMap[e.code] = true;

    // Prevent default scrolling for game controls
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keyMap[e.code] = false;
  }

  public setVirtualKey(key: 'left' | 'right' | 'up' | 'down', pressed: boolean) {
    if (key === 'left') this.virtualLeft = pressed;
    if (key === 'right') this.virtualRight = pressed;
    if (key === 'up') this.virtualUp = pressed;
    if (key === 'down') this.virtualDown = pressed;
  }

  public update(): InputState {
    const k = this.keyMap;

    let gpLeft = false;
    let gpRight = false;
    let gpUp = false;
    let gpDown = false;
    let gpPause = false;
    let gpRestart = false;

    // Gamepad API integration
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (gp) {
      const axisX = gp.axes[0] || 0;
      const axisY = gp.axes[1] || 0;
      gpLeft = axisX < -0.35 || gp.buttons[14]?.pressed;
      gpRight = axisX > 0.35 || gp.buttons[15]?.pressed;
      gpUp = axisY < -0.35 || gp.buttons[0]?.pressed || gp.buttons[12]?.pressed;
      gpDown = axisY > 0.35 || gp.buttons[13]?.pressed;
      gpPause = gp.buttons[9]?.pressed; // Start
      gpRestart = gp.buttons[8]?.pressed; // Select
    }

    this.state.left = !!k['ArrowLeft'] || !!k['KeyA'] || this.virtualLeft || gpLeft;
    this.state.right = !!k['ArrowRight'] || !!k['KeyD'] || this.virtualRight || gpRight;
    this.state.up = !!k['ArrowUp'] || !!k['KeyW'] || !!k['Space'] || this.virtualUp || gpUp;
    this.state.down = !!k['ArrowDown'] || !!k['KeyS'] || this.virtualDown || gpDown;

    this.state.restart = !!k['KeyR'] || gpRestart;
    this.state.pause = !!k['KeyP'] || !!k['Escape'] || gpPause;
    this.state.muteMusic = !!k['KeyM'];
    this.state.muteSound = !!k['KeyN'];

    return this.state;
  }
}
