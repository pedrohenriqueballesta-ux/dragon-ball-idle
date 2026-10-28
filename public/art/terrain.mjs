// Cenário: grama, caminhos, pedras, árvores e a barraca do mercador.
import { art, loaded } from './assets.mjs';

const patterns = new WeakMap();
export const CLEARINGS = [
  [220, 200, 440, 310, 75], [0, 375, 1100, 125, 62],
  [775, 425, 145, 1130, 72], [1000, 330, 1170, 660, 140],
  [830, 490, 300, 250, 100], [1360, 910, 300, 500, 110],
  [820, 1390, 1560, 520, 150], [2720, 260, 490, 1680, 110]
];
// Build a smoothed union once so intersections are rounded without adding bulges.
let roadPath = null;
function roads(config) {
  if (roadPath) return roadPath;
  const resolution = 4;
  const mask = document.createElement('canvas');
  mask.width = Math.ceil(config.width / resolution); mask.height = Math.ceil(config.height / resolution);
  const painter = mask.getContext('2d'); painter.scale(1 / resolution, 1 / resolution);
  painter.fillStyle = '#fff'; painter.beginPath();
  for (const [x, y, w, h, r] of CLEARINGS) painter.roundRect(x, y, w, h, r);
  painter.fill();
  const soft = document.createElement('canvas'); soft.width = mask.width; soft.height = mask.height;
  const brush = soft.getContext('2d'); brush.filter = 'blur(6px)'; brush.drawImage(mask, 0, 0);
  const rgba = brush.getImageData(0, 0, soft.width, soft.height).data;
  const path = new Path2D(); let previous = new Map();
  const finish = item => path.rect(item.x * resolution, item.y * resolution, item.w * resolution, item.h * resolution);
  for (let y = 0; y < soft.height; y++) {
    const current = new Map(); let x = 0;
    while (x < soft.width) {
      while (x < soft.width && rgba[(y * soft.width + x) * 4 + 3] < 128) x++;
      const start = x;
      while (x < soft.width && rgba[(y * soft.width + x) * 4 + 3] >= 128) x++;
      if (x > start) {
        const key = start + ':' + x, item = previous.get(key) || { x: start, y, w: x - start, h: 0 };
        item.h++; current.set(key, item);
      }
    }
    for (const [key, item] of previous) if (!current.has(key)) finish(item);
    previous = current;
  }
  for (const item of previous.values()) finish(item);
  roadPath = path; return path;
}

function pattern(ctx, image, width, height, fallback) {
  if (!loaded(image)) return fallback;
  if (!patterns.has(image)) {
    const tile = document.createElement('canvas');
    tile.width = width; tile.height = height;
    const tileCtx = tile.getContext('2d');
    tileCtx.imageSmoothingEnabled = false;
    tileCtx.drawImage(image, 0, 0, width, height);
    patterns.set(image, ctx.createPattern(tile, 'repeat'));
  }
  return patterns.get(image);
}

export function drawTerrain(ctx, config, zones, merchant, camera, width, height) {
  const x = camera.x - 4, y = camera.y - 4;
  const w = width / camera.scale + 8, h = height / camera.scale + 8;
  ctx.fillStyle = pattern(ctx, art.grass, 384, 256, '#536b3a');
  ctx.fillRect(x, y, w, h);

  // The clearings are visual ground only: existing obstacle and movement rules remain in the engine.
  ctx.save(); ctx.clip(roads(config));
  ctx.fillStyle = pattern(ctx, art.earth, 362, 272, '#b28f64');
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  const crater = zones.find(zone => zone.id === 'cratera');
  ctx.fillStyle = '#762d171c'; ctx.fillRect(crater.x, crater.y, crater.w, crater.h);
  const arena = zones.find(zone => zone.pvp);
  ctx.fillStyle = '#781c151c'; ctx.fillRect(arena.x, arena.y, arena.w, arena.h);
  ctx.strokeStyle = '#d15039'; ctx.lineWidth = 3; ctx.setLineDash([14, 9]);
  ctx.strokeRect(arena.x, arena.y, arena.w, arena.h); ctx.setLineDash([]);
  ctx.strokeStyle = '#22341e'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, config.width, config.height);

  drawMarket(ctx, merchant);
}

// Solo do planeta a partir de uma imagem única esticada para o tamanho do mundo.
// Desenha só o trecho visível na câmera.
export function drawGroundImage(ctx, image, world, camera, width, height) {
  if (!loaded(image)) return false;
  const kx = image.naturalWidth / world.w, ky = image.naturalHeight / world.h;
  const x = Math.max(0, camera.x - 4), y = Math.max(0, camera.y - 4);
  const w = Math.min(world.w - x, width / camera.scale + 8), h = Math.min(world.h - y, height / camera.scale + 8);
  ctx.drawImage(image, x * kx, y * ky, w * kx, h * ky, x, y, w, h);
  return true;
}

// Barraca do mercador: fica no lugar do MERCHANT e não bloqueia a passagem.
export function drawMarket(ctx, merchant) {
  const mx = merchant.x, my = merchant.y;
  ctx.fillStyle = '#513322'; ctx.fillRect(mx - 49, my - 54, 98, 46);
  ctx.fillStyle = '#a4623a'; ctx.fillRect(mx - 55, my - 63, 110, 20);
  ctx.fillStyle = '#f0cb88';
  for (let i = 0; i < 5; i++) ctx.fillRect(mx - 51 + i * 22, my - 61, 11, 17);
  ctx.fillStyle = '#3a2c22'; ctx.fillRect(mx - 57, my - 45, 114, 6);
  ctx.fillStyle = '#f4deb0'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
  ctx.strokeStyle = '#292016'; ctx.lineWidth = 3;
  ctx.strokeText('MERCADO', mx, my + 21); ctx.fillText('MERCADO', mx, my + 21);
}

export function drawTree(ctx, obstacle) {
  if (!loaded(art.tree)) return false;
  // Draw to the existing obstacle's ground anchor for collision and depth sorting.
  const size = obstacle.r * 3.8;
  ctx.drawImage(art.tree, 33, 33, 1279, 1097,
    Math.round(obstacle.x - size / 2), Math.round(obstacle.y - size * 0.82), size, size * 0.86);
  return true;
}

export function drawRock(ctx, obstacle) {
  if (!loaded(art.rock)) return false;
  const size = obstacle.r * 2.3;
  const height = size * 0.75;
  ctx.fillStyle = '#17251072'; ctx.beginPath();
  ctx.ellipse(obstacle.x, obstacle.y + 2, obstacle.r * 0.92, obstacle.r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(art.rock, 360, 210, 815, 606,
    Math.round(obstacle.x - size / 2), Math.round(obstacle.y - height + 2), size, height);
  return true;
}

export function drawVendor(ctx, merchant) {
  if (!loaded(art.vendor)) return;
  ctx.drawImage(art.vendor, 319, 148, 606, 1001, merchant.x - 17, merchant.y - 53, 34, 56);
}
