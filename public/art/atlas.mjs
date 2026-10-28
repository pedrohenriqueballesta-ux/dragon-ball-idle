// Recorte dos sprite sheets de 16 quadros (caminhada e ataque), em 8 direções.
// Compartilhado por Goku e inimigos. Usa vistas diagonais quando existem.
import { art, loaded } from './assets.mjs';
import { spriteFacing, walkStep, strikeFrame } from '../render/camera.mjs';
import { SPRITE_DATA } from './sprite-data.mjs';

// Five distinct views, with the three opposite views mirrored for consistent anatomy.
// Back-diagonal views use a rear three-quarter drawing, never a side/front substitute.
const VIEWS = [
  { row: 0, flip: false }, { row: 1, flip: false }, { row: 2, flip: false },
  { row: 3, flip: false }, { row: 4, flip: false }, { row: 3, flip: true },
  { row: 2, flip: true }, { row: 1, flip: true }
];
function drawAtlas(ctx, key, pos, height, facing, frame) {
  const direction = spriteFacing(facing);
  const diagonalKey = key.replace(/(Walk|Attack)$/, 'Diagonal$1');
  const useDiagonal = direction % 2 === 1 && SPRITE_DATA[diagonalKey];
  const selected = useDiagonal ? diagonalKey : key;
  const data = SPRITE_DATA[selected], image = art[selected];
  if (!loaded(image)) return false;
  const { row, flip } = useDiagonal ? { row: direction === 1 || direction === 7 ? 0 : 1, flip: direction > 4 } : VIEWS[direction];
  const [sx, sy, sw, sh, anchorX, anchorY] = data.frames[row][frame];
  const scale = height / data.referenceHeight;
  ctx.save(); ctx.translate(Math.round(pos.x), Math.round(pos.y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, sx, sy, sw, sh,
    (sx - anchorX) * scale, (sy - anchorY) * scale + 6, sw * scale, sh * scale);
  ctx.restore();
  return true;
}
export function drawWalk(ctx, kind, pos, height, facing, moving, stride = 96, phase = 0) {
  return drawAtlas(ctx, kind + 'Walk', pos, height, facing, moving ? walkStep(pos.travelled || 0, stride, phase) : 0);
}
export function drawAttack(ctx, kind, pos, height, facing, progress) {
  return drawAtlas(ctx, kind + 'Attack', pos, height, facing, strikeFrame(progress));
}
