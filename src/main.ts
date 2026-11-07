// Bootstrap & DOM Controller for Bumpy Replica

import { BumpyGame } from './engine/Game';
import { audio } from './engine/Audio';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('gameCanvas not found');

  canvas.width = 768;
  canvas.height = 576;

  const game = new BumpyGame(canvas);

  // Instant mobile audio unlock on first touch
  const unlockOnFirstGesture = () => {
    audio.unlockAudio();
    window.removeEventListener('touchstart', unlockOnFirstGesture);
    window.removeEventListener('pointerdown', unlockOnFirstGesture);
  };
  window.addEventListener('touchstart', unlockOnFirstGesture, { passive: true });
  window.addEventListener('pointerdown', unlockOnFirstGesture, { passive: true });

  // Connect Top Control Toolbar Buttons
  const btnSound = document.getElementById('btn-sound');
  const btnMusic = document.getElementById('btn-music');
  const btnCrt = document.getElementById('btn-crt');
  const btnLevelSelect = document.getElementById('btn-level-select');
  const btnHelp = document.getElementById('btn-help');
  const btnRestart = document.getElementById('btn-restart');
  const btnFullscreen = document.getElementById('btn-fullscreen');

  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const on = game.toggleMuteSound();
      btnSound.textContent = on ? '🔊 SFX: ON' : '🔇 SFX: OFF';
    });
  }

  if (btnMusic) {
    btnMusic.addEventListener('click', () => {
      const on = game.toggleMuteMusic();
      btnMusic.textContent = on ? '🎵 MUSIC: ON' : '🔇 MUSIC: OFF';
    });
  }

  if (btnCrt) {
    btnCrt.addEventListener('click', () => {
      const on = game.toggleCrt();
      btnCrt.textContent = on ? '📺 CRT: ON' : '📺 CRT: OFF';
    });
  }

  if (btnLevelSelect) {
    btnLevelSelect.addEventListener('click', () => {
      game.openLevelSelect();
    });
  }

  if (btnHelp) {
    btnHelp.addEventListener('click', () => {
      game.openInstructions();
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }));
      setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR' }));
      }, 50);
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      const cabinet = document.getElementById('arcade-wrapper');
      if (!document.fullscreenElement && cabinet) {
        cabinet.requestFullscreen().catch(() => {});
      } else if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // Connect Mobile Touch Virtual D-Pad & Action Button
  const hookTouch = (elementId: string, key: 'left' | 'right' | 'up' | 'down') => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const startPress = (e: Event) => {
      e.preventDefault();
      audio.unlockAudio();
      if ('vibrate' in navigator) navigator.vibrate(8);
      game.setVirtualKey(key, true);
    };
    const endPress = (e: Event) => {
      e.preventDefault();
      game.setVirtualKey(key, false);
    };
    el.addEventListener('touchstart', startPress, { passive: false });
    el.addEventListener('touchend', endPress, { passive: false });
    el.addEventListener('mousedown', startPress);
    el.addEventListener('mouseup', endPress);
    el.addEventListener('mouseleave', endPress);
  };

  hookTouch('touch-left', 'left');
  hookTouch('touch-right', 'right');
  hookTouch('touch-up', 'up');
  hookTouch('touch-down', 'down');
  hookTouch('touch-jump-action', 'up');

  // Direct Screen Touch Steering on Canvas
  let activeCanvasTouches: { [id: number]: { x: number; y: number } } = {};

  const updateCanvasTouchInput = () => {
    let hasLeft = false;
    let hasRight = false;
    let hasUp = false;
    let hasDown = false;

    for (const id in activeCanvasTouches) {
      const t = activeCanvasTouches[id];
      if (t.x < 0.38) hasLeft = true;
      if (t.x > 0.62) hasRight = true;
      if (t.y < 0.45) hasUp = true;
      if (t.y > 0.75) hasDown = true;
    }

    // Only apply if virtual buttons are not already being held
    game.setVirtualKey('left', hasLeft);
    game.setVirtualKey('right', hasRight);
    game.setVirtualKey('up', hasUp);
    game.setVirtualKey('down', hasDown);
  };

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    audio.unlockAudio();
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const normX = (touch.clientX - rect.left) / rect.width;
      const normY = (touch.clientY - rect.top) / rect.height;
      activeCanvasTouches[touch.identifier] = { x: normX, y: normY };
    }
    updateCanvasTouchInput();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const normX = (touch.clientX - rect.left) / rect.width;
      const normY = (touch.clientY - rect.top) / rect.height;
      activeCanvasTouches[touch.identifier] = { x: normX, y: normY };
    }
    updateCanvasTouchInput();
  }, { passive: false });

  const removeCanvasTouches = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      delete activeCanvasTouches[e.changedTouches[i].identifier];
    }
    updateCanvasTouchInput();
  };

  canvas.addEventListener('touchend', removeCanvasTouches, { passive: false });
  canvas.addEventListener('touchcancel', removeCanvasTouches, { passive: false });

  // Main 60 FPS RequestAnimationFrame Loop
  let lastTime = performance.now();
  function gameLoop(now: number) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    game.update(dt);
    game.render(dt);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
