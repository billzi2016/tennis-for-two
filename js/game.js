import { PLAYERS, WORLD } from "./config.js";
import { createAi, updateAi } from "./ai.js";
import { playHitSound, tryAutoplayAudio, unlockAudio } from "./audio.js";
import { createBall, hitNet, isDead, shotVelocity, stepBall } from "./physics.js";
import { createRenderer } from "./renderer.js";

const canvas = document.getElementById("game");
const rallyEl = document.getElementById("rally");
const renderer = createRenderer(canvas);

tryAutoplayAudio();
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

const state = {
  ball: createBall(),
  players: [createAi(PLAYERS.left), createAi(PLAYERS.right)],
  rally: 0,
  pulse: 0,
  serveSide: -1
};

let lastTime = performance.now();

function resetBall() {
  state.serveSide *= -1;
  const server = state.serveSide < 0 ? PLAYERS.left : PLAYERS.right;
  state.ball.x = server.x + 70 * -state.serveSide;
  state.ball.y = 345;
  state.ball.vx = -state.serveSide * 520;
  state.ball.vy = -500;
}

function rescueBall() {
  const from = {
    x: clamp(state.ball.x, 105, WORLD.width - 105),
    y: clamp(state.ball.y, 220, WORLD.groundY - 18)
  };
  const toRight = from.x < WORLD.netX;
  const target = {
    x: toRight ? WORLD.width * 0.74 : WORLD.width * 0.26,
    y: WORLD.groundY - 28
  };
  const velocity = shotVelocity(from, target, 1.18);

  state.ball.x = from.x;
  state.ball.y = from.y;
  state.ball.vx = velocity.vx;
  state.ball.vy = velocity.vy;
  state.pulse = 0.75;
}

function update(dt) {
  stepBall(state.ball, dt);

  for (const player of state.players) {
    if (updateAi(player, state.ball, dt, state.rally)) {
      state.rally += 1;
      state.pulse = 1;
      playHitSound(0.9 + Math.min(state.rally, 20) * 0.005);
      rallyEl.textContent = String(state.rally).padStart(4, "0").slice(-4);
    }
  }

  if (hitNet(state.ball)) {
    state.ball.x += Math.sign(state.ball.vx || 1) * (state.ball.radius + 4);
    rescueBall();
  }

  if (needsSoftRescue()) {
    rescueBall();
  }

  if (isDead(state.ball)) {
    rescueBall();
  }

  state.pulse = Math.max(0, state.pulse - dt * 2.8);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function needsSoftRescue() {
  const nearGround = state.ball.y > WORLD.groundY - WORLD.ballRadius && state.ball.vy > 0;
  const nearLeftWall = state.ball.x < 96 && state.ball.vx < 0;
  const nearRightWall = state.ball.x > WORLD.width - 96 && state.ball.vx > 0;
  const tooHigh = state.ball.y < 40 && state.ball.vy < -120;
  return nearGround || nearLeftWall || nearRightWall || tooHigh;
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.032);
  lastTime = now;
  update(dt);
  renderer.draw(state);
  requestAnimationFrame(loop);
}

resetBall();
requestAnimationFrame(loop);
