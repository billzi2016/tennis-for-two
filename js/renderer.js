import { RENDER, WORLD } from "./config.js";

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000803";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  return {
    draw(state) {
      fade(ctx);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawCourt(ctx);
      drawPlayers(ctx, state.players);
      drawBall(ctx, state.ball, state.pulse);
      drawNoise(ctx);
      ctx.restore();
    }
  };
}

function fade(ctx) {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(0, 8, 3, ${RENDER.fadeAlpha})`;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
}

function line(ctx, x1, y1, x2, y2, width = 2, alpha = 0.86) {
  ctx.save();
  ctx.strokeStyle = `rgba(138, 255, 170, ${alpha})`;
  ctx.shadowColor = RENDER.glowColor;
  ctx.shadowBlur = 12;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawCourt(ctx) {
  line(ctx, 90, WORLD.groundY, WORLD.width - 90, WORLD.groundY, 3, 0.9);
  line(ctx, WORLD.netX, WORLD.groundY, WORLD.netX, WORLD.netTopY, 3, 0.9);
}

function drawPlayers(ctx, players) {
  for (const player of players) {
    ctx.save();
    ctx.globalAlpha = 0.48 + player.glow * 0.5;
    ctx.strokeStyle = "#8affaa";
    ctx.shadowColor = "#8affaa";
    ctx.shadowBlur = 15 + player.glow * 20;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18 + player.glow * 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.72 + player.glow * 0.25;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 7 + player.glow * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBall(ctx, ball, pulse) {
  ctx.save();
  ctx.fillStyle = "#d6ffde";
  ctx.shadowColor = "#a8ffba";
  ctx.shadowBlur = 22 + pulse * 28;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius + pulse * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNoise(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.032;
  ctx.fillStyle = "#8affaa";

  for (let i = 0; i < 64; i += 1) {
    ctx.fillRect(Math.random() * WORLD.width, Math.random() * WORLD.height, 1.2, 1.2);
  }

  ctx.restore();
}
