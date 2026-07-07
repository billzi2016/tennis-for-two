import { WORLD } from "./config.js";

export function createBall() {
  return {
    x: WORLD.width * 0.5,
    y: 340,
    vx: 430,
    vy: -470,
    radius: WORLD.ballRadius
  };
}

export function stepBall(ball, dt) {
  ball.vy += WORLD.gravity * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
}

export function positionAt(ball, time) {
  return {
    x: ball.x + ball.vx * time,
    y: ball.y + ball.vy * time + 0.5 * WORLD.gravity * time * time
  };
}

export function simulateTrajectory(ball, maxTime, step) {
  const points = [];

  for (let time = step; time <= maxTime; time += step) {
    const point = positionAt(ball, time);
    points.push({ ...point, time });

    if (point.y >= WORLD.groundY || point.x < -80 || point.x > WORLD.width + 80) {
      break;
    }
  }

  return points;
}

export function timeToX(ball, x) {
  if (Math.abs(ball.vx) < 0.001) {
    return null;
  }

  const time = (x - ball.x) / ball.vx;
  return time >= 0 ? time : null;
}

export function shotVelocity(from, target, flightTime) {
  return {
    vx: (target.x - from.x) / flightTime,
    vy: (target.y - from.y - 0.5 * WORLD.gravity * flightTime * flightTime) / flightTime
  };
}

export function yAtXForVelocity(from, velocity, x) {
  if (Math.abs(velocity.vx) < 0.001) {
    return Infinity;
  }

  const time = (x - from.x) / velocity.vx;
  if (time < 0) {
    return Infinity;
  }

  return from.y + velocity.vy * time + 0.5 * WORLD.gravity * time * time;
}

export function speedOf(velocity) {
  return Math.hypot(velocity.vx, velocity.vy);
}

export function isDead(ball) {
  return (
    ball.y > WORLD.groundY + 70 ||
    ball.x < -120 ||
    ball.x > WORLD.width + 120 ||
    ball.y < -160
  );
}

export function hitNet(ball) {
  const closeToNet = Math.abs(ball.x - WORLD.netX) <= ball.radius + 3;
  return closeToNet && ball.y + ball.radius >= WORLD.netTopY;
}
