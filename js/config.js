export const WORLD = {
  width: 1280,
  height: 720,
  groundY: 555,
  netX: 640,
  netTopY: 370,
  gravity: 820,
  ballRadius: 8,
  minPlayableY: 95,
  maxPlayableY: 552
};

export const PLAYERS = {
  left: {
    id: "left",
    side: -1,
    x: 260,
    y: 510,
    minX: 120,
    maxX: 555,
    targetMinX: 760,
    targetMaxX: 1130
  },
  right: {
    id: "right",
    side: 1,
    x: 1020,
    y: 510,
    minX: 725,
    maxX: 1160,
    targetMinX: 150,
    targetMaxX: 520
  }
};

export const AI = {
  hitRadius: 34,
  moveSpeed: 1450,
  approachWindow: 0.58,
  planLockTime: 0.9,
  strikeLeadTime: 0.055,
  minShotTime: 0.72,
  maxShotTime: 1.35,
  minNetClearance: 24,
  maxLaunchSpeed: 980,
  minLaunchSpeed: 430,
  cooldown: 0.12,
  lookAhead: 2.4,
  simulationStep: 1 / 120,
  minIncomingFlightTime: 0.34,
  preferredStrikeTime: 0.78,
  emergencyGroundMargin: 34,
  minStrikeY: 315,
  maxStrikeY: 535,
  targetJitterX: 62,
  targetJitterY: 28,
  repeatTargetPenaltyRadius: 125,
  rescueMargin: 58,
  rescueSpeed: 640
};

export const RENDER = {
  fadeAlpha: 0.16,
  lineColor: "rgba(138, 255, 170, 0.88)",
  dimLineColor: "rgba(85, 220, 124, 0.22)",
  glowColor: "rgba(138, 255, 170, 0.92)"
};
