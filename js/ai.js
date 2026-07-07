import { AI, WORLD } from "./config.js";
import { shotVelocity, simulateTrajectory, speedOf, yAtXForVelocity } from "./physics.js";

export function createAi(player) {
  return {
    ...player,
    cooldown: 0,
    glow: 0,
    homeX: player.x,
    homeY: player.y,
    lastPlan: null,
    planAge: 0,
    lastTarget: null
  };
}

export function updateAi(ai, ball, dt, rally) {
  ai.cooldown = Math.max(0, ai.cooldown - dt);
  ai.glow = Math.max(0, ai.glow - dt * 3.4);
  ai.planAge += dt;
  if (ai.lastPlan) {
    ai.lastPlan.time = Math.max(0, ai.lastPlan.time - dt);
  }
  if (!isPlanUsable(ai, ball)) {
    ai.lastPlan = planInterception(ai, ball);
    ai.planAge = 0;
  }

  moveToPlan(ai, dt);

  if (!ai.lastPlan || ai.cooldown > 0) {
    return false;
  }

  const ballDistance = Math.hypot(ball.x - ai.lastPlan.x, ball.y - ai.lastPlan.y);
  const paddleDistance = Math.hypot(ai.x - ai.lastPlan.x, ai.y - ai.lastPlan.y);
  const readyByRange = ballDistance <= AI.hitRadius && paddleDistance <= AI.hitRadius;
  const paddleReady = paddleDistance <= AI.hitRadius * 1.25;

  if (!paddleReady || !readyByRange) {
    return false;
  }

  const velocity = solveReturn(ai, ball, rally);
  ball.vx = velocity.vx;
  ball.vy = velocity.vy;
  ai.cooldown = AI.cooldown;
  ai.glow = 1;
  ai.lastPlan = null;
  ai.planAge = 0;
  return true;
}

function isPlanUsable(ai, ball) {
  if (!ai.lastPlan || ai.planAge > AI.planLockTime || !ballMovingToward(ai, ball)) {
    return false;
  }

  const remainingX = ai.lastPlan.x - ball.x;
  const stillAhead = ai.side < 0 ? remainingX < 8 : remainingX > -8;
  const inRangeY = ai.lastPlan.y >= AI.minStrikeY && ai.lastPlan.y <= AI.maxStrikeY;
  return stillAhead && inRangeY;
}

function planInterception(ai, ball) {
  if (!ballMovingToward(ai, ball)) {
    return null;
  }

  const trajectory = simulateTrajectory(ball, AI.lookAhead, AI.simulationStep);
  let best = null;
  let bestScore = -Infinity;

  for (const point of trajectory) {
    if (!isStrikeCandidate(ai, point)) {
      continue;
    }

    const score = scoreStrikePoint(ai, point);
    if (score > bestScore) {
      best = point;
      bestScore = score;
    }
  }

  return best;
}

function ballMovingToward(ai, ball) {
  return ai.side < 0 ? ball.vx < 0 : ball.vx > 0;
}

function isStrikeCandidate(ai, point) {
  const ownHalf = ai.side < 0 ? point.x < WORLD.netX - 18 : point.x > WORLD.netX + 18;
  const insideReachX = point.x >= ai.minX && point.x <= ai.maxX;
  const insideReachY = point.y >= AI.minStrikeY && point.y <= AI.maxStrikeY;
  const waitedLongEnough =
    point.time >= AI.minIncomingFlightTime ||
    point.y >= WORLD.groundY - AI.emergencyGroundMargin;
  return ownHalf && insideReachX && insideReachY && waitedLongEnough;
}

function scoreStrikePoint(ai, point) {
  const depth = ai.side < 0
    ? (WORLD.netX - point.x) / (WORLD.netX - ai.minX)
    : (point.x - WORLD.netX) / (ai.maxX - WORLD.netX);
  const timeScore = 1 - Math.abs(point.time - AI.preferredStrikeTime);
  const emergencyPenalty = point.y > WORLD.groundY - AI.emergencyGroundMargin ? -0.25 : 0;
  return depth * 1.55 + timeScore * 1.15 + emergencyPenalty;
}

function moveToPlan(ai, dt) {
  const target = ai.lastPlan || { x: ai.homeX, y: ai.homeY };
  const dx = target.x - ai.x;
  const dy = target.y - ai.y;
  const distance = Math.hypot(dx, dy);
  const timeRemaining = ai.lastPlan ? Math.max(ai.lastPlan.time - AI.arrivalLeadTime, dt) : 0.55;
  const plannedSpeed = distance / timeRemaining;
  const speed = clamp(plannedSpeed, AI.minMoveSpeed, AI.moveSpeed);
  const step = speed * dt;

  if (distance <= step || distance === 0) {
    ai.x = target.x;
    ai.y = target.y;
    return;
  }

  ai.x += (dx / distance) * step;
  ai.y += (dy / distance) * step;
}

function solveReturn(ai, ball, rally) {
  const from = { x: ball.x, y: ball.y };
  const candidates = buildCandidateTargets(ai, rally);
  let bestVelocity = null;
  let bestTarget = null;
  let bestScore = -Infinity;

  for (const target of candidates) {
    for (let t = target.time[0]; t <= target.time[1]; t += 0.04) {
      const velocity = shotVelocity(from, target, t);
      const speed = speedOf(velocity);
      const netY = yAtXForVelocity(from, velocity, WORLD.netX);
      const correctDirection = ai.side < 0 ? velocity.vx > 0 : velocity.vx < 0;
      const clearsNet = netY < WORLD.netTopY - AI.minNetClearance;

      if (
        correctDirection &&
        clearsNet &&
        speed >= AI.minLaunchSpeed &&
        speed <= AI.maxLaunchSpeed
      ) {
        const score = scoreReturnTarget(ai, target, speed, t);
        if (score > bestScore) {
          bestVelocity = velocity;
          bestTarget = target;
          bestScore = score;
        }
      }
    }
  }

  if (bestVelocity) {
    ai.lastTarget = bestTarget;
    return bestVelocity;
  }

  const fallback = emergencyLob(ai, from);
  ai.lastTarget = fallback.target;
  return fallback.velocity;
}

function buildCandidateTargets(ai, rally) {
  const targets = [];
  const width = ai.targetMaxX - ai.targetMinX;
  const phase = rally % 12;
  const lanes = [
    { x: 0.16, y: 532, weight: phase === 0 ? 1.35 : 0.82, time: [1.02, 1.54] },
    { x: 0.31, y: 505, weight: phase === 1 ? 1.28 : 0.95, time: [0.86, 1.3] },
    { x: 0.48, y: 538, weight: phase === 2 ? 1.22 : 1.02, time: [0.92, 1.42] },
    { x: 0.65, y: 492, weight: phase === 3 ? 1.26 : 0.98, time: [0.78, 1.22] },
    { x: 0.86, y: 525, weight: phase === 4 ? 1.32 : 0.86, time: [1.0, 1.52] },
    { x: 0.24, y: 462, weight: phase === 5 ? 1.18 : 0.68, time: [0.72, 1.1] },
    { x: 0.74, y: 458, weight: phase === 6 ? 1.18 : 0.7, time: [0.72, 1.08] },
    { x: 0.42, y: 430, weight: phase === 7 ? 1.1 : 0.56, time: [0.76, 1.18] },
    { x: 0.58, y: 545, weight: phase > 7 ? 1.12 : 0.9, time: [1.12, 1.62] }
  ];

  for (const lane of lanes) {
    for (let i = 0; i < 3; i += 1) {
      const rallyWave = Math.sin((rally + i) * 0.71) * 0.04;
      const jitterX = randomBetween(-AI.targetJitterX, AI.targetJitterX);
      const jitterY = randomBetween(-AI.targetJitterY, AI.targetJitterY);
      targets.push({
        x: clamp(ai.targetMinX + width * (lane.x + rallyWave) + jitterX, ai.targetMinX, ai.targetMaxX),
        y: clamp(lane.y + jitterY, 420, WORLD.groundY - 10),
        weight: lane.weight,
        time: lane.time
      });
    }
  }

  return targets;
}

function emergencyLob(ai, from) {
  const targetX = ai.side < 0 ? WORLD.width * 0.72 : WORLD.width * 0.28;
  const target = { x: targetX, y: 520 };
  return {
    target,
    velocity: shotVelocity(from, target, 1.42)
  };
}

function scoreReturnTarget(ai, target, speed, flightTime) {
  const repeatDistance = ai.lastTarget
    ? Math.hypot(target.x - ai.lastTarget.x, target.y - ai.lastTarget.y)
    : Infinity;
  const repeatPenalty = repeatDistance < AI.repeatTargetPenaltyRadius ? 1.2 : 0;
  const speedScore = 1 - Math.abs(speed - 710) / 710;
  const timeScore = 1 - Math.abs(flightTime - (target.time[0] + target.time[1]) / 2);
  const sidelineBonus = Math.abs(target.x - (ai.targetMinX + ai.targetMaxX) / 2) / (ai.targetMaxX - ai.targetMinX);
  return target.weight + speedScore * 0.28 + timeScore * 0.26 + sidelineBonus * 0.18 - repeatPenalty + Math.random() * 0.42;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
