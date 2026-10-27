// Visuals are separate from the authoritative simulation in engine.mjs.
import { spriteFacing, walkStep } from './view.mjs';
const loadImage = url => { const image = new Image(); image.src = url; return image; };
export const art = {
  goku: loadImage('/assets/goku-sheet.png'),
  tree: loadImage('/assets/tree.png'),
  rock: loadImage('/assets/rock.png'),
  alien: loadImage('/assets/alien.png'),
  vendor: loadImage('/assets/vendor.png'),
  saibaman: loadImage('/assets/saibaman.png'),
  gokuWalk: loadImage('/assets/goku-walk.png'),
  ssjWalk: loadImage('/assets/ssj-walk.png'),
  saibamanWalk: loadImage('/assets/saibaman-walk.png'),
  alienWalk: loadImage('/assets/alien-walk.png'),
  gokuAttack: loadImage('/assets/goku-attack.png'),
  ssjAttack: loadImage('/assets/ssj-attack.png'),
  saibamanAttack: loadImage('/assets/saibaman-attack.png'),
  alienAttack: loadImage('/assets/alien-attack.png'),
  grass: loadImage('/assets/grass.png'),
  earth: loadImage('/assets/earth.png')
};

const loaded = image => image.complete && image.naturalWidth > 0;
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

const WALK_ATLASES = {
  goku: { image: art.gokuWalk, x: [100, 530, 980, 1420], w: [285, 285, 285, 280], y: [45, 475], h: 405 },
  ssj: { image: art.ssjWalk, x: [100, 530, 980, 1420], w: [285, 285, 285, 280], y: [45, 475], h: 405 },
  saibaman: { image: art.saibamanWalk, x: [105, 525, 955, 1380], w: [305, 305, 285, 285], y: [22, 450], h: 422 },
  alien: { image: art.alienWalk, x: [150, 530, 950, 1338], w: [310, 310, 270, 280], y: [10, 450], h: 430 }
};
const ATTACK_ATLASES = {
  goku: { image: art.gokuAttack, x: [90, 485, 930, 1350], w: [315, 330, 365, 380], y: [45, 465], h: 410 },
  ssj: { image: art.ssjAttack, x: [90, 485, 930, 1350], w: [315, 330, 365, 380], y: [45, 465], h: 410 },
  saibaman: { image: art.saibamanAttack, x: [65, 480, 880, 1335], w: [370, 385, 400, 400], y: [55, 465], h: 405 },
  alien: { image: art.alienAttack, x: [150, 530, 950, 1360], w: [315, 350, 325, 365], y: [10, 450], h: 430 }
};
function drawAtlas(ctx, atlas, pos, width, height, facing, row) {
  if (!loaded(atlas.image)) return false;
  const { column, flip } = spriteFacing(facing);
  ctx.save(); ctx.translate(Math.round(pos.x), Math.round(pos.y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(atlas.image, atlas.x[column], atlas.y[row], atlas.w[column], atlas.h,
    -width / 2, -height + 6, width, height);
  ctx.restore();
  return true;
}
function drawWalk(ctx, kind, pos, width, height, facing, time, phase = 0) {
  return drawAtlas(ctx, WALK_ATLASES[kind], pos, width, height, facing, walkStep(time, phase));
}
function drawAttack(ctx, kind, pos, width, height, facing, progress) {
  return drawAtlas(ctx, ATTACK_ATLASES[kind], pos, width, height, facing, progress < 0.5 ? 0 : 1);
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

  // The merchant stand sits at the original location and is deliberately passable.
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

export function drawAlien(ctx, x, y, size, height, time, moving, facing, phase, attackProgress = null) {
  if (attackProgress !== null && drawAttack(ctx, 'alien', { x, y }, size + 8, height, facing, attackProgress)) return true;
  if (moving && drawWalk(ctx, 'alien', { x, y }, size, height, facing, time, phase)) return true;
  if (!loaded(art.alien)) return false;
  const bounce = moving ? Math.sin(time * 11) * 1.5 : 0;
  ctx.drawImage(art.alien, 228, 107, 800, 1044,
    Math.round(x - size / 2), Math.round(y - height + 7 + bounce), size, height);
  return true;
}

export function drawSaibaman(ctx, x, y, size, height, time, moving, facing, phase, attackProgress = null) {
  if (attackProgress !== null && drawAttack(ctx, 'saibaman', { x, y }, size + 8, height, facing, attackProgress)) return true;
  if (moving && drawWalk(ctx, 'saibaman', { x, y }, size, height, facing, time, phase)) return true;
  if (!loaded(art.saibaman)) return false;
  const bounce = moving ? Math.sin(time * 12) * 1.5 : 0;
  ctx.drawImage(art.saibaman, 371, 309, 512, 679,
    Math.round(x - size / 2), Math.round(y - height + 7 + bounce), size, height);
  return true;
}

export function drawGoku(ctx, player, pos, time, strikeProgress = null) {
  if (strikeProgress !== null && !player.dead && !player.charge &&
      drawAttack(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, 70, player.facing, strikeProgress)) return true;
  if (player.moving && !player.dead && !player.charge && strikeProgress === null &&
      drawWalk(ctx, player.transformed ? 'ssj' : 'goku', pos, 52, 70, player.facing, time)) return true;
  if (!loaded(art.goku)) return false;
  const f = player.facing || { x: 0, y: 1 };
  const horizontal = Math.abs(f.x) > Math.abs(f.y) * 1.15;
  const back = !horizontal && f.y < 0;
  const column = horizontal ? 2 : back ? 4 : 0;
  let row = player.transformed ? 9 : (player.charge ? 8 : strikeProgress !== null ? 4 : (player.moving && !back ? 1 : 0));
  if (player.dead) row = 7;
  const rowY = [55, 179, 304, 425, 545, 660, 783, 894, 966, 1088];
  const sourceX = 180 + column * 114;
  const bob = player.moving ? Math.sin(time * 13) * 1.3 : 0;
  ctx.save();
  ctx.translate(Math.round(pos.x), Math.round(pos.y + bob));
  if (horizontal && f.x < 0) ctx.scale(-1, 1);
  ctx.drawImage(art.goku, sourceX, rowY[row], 100, 110, -32, -63, 64, 70);
  ctx.restore();
  return true;
}
