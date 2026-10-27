// Desenho do Saibaman (inimigo corpo a corpo), com caminhada e ataque.
import { art, loaded } from './assets.mjs';
import { drawWalk, drawAttack } from './atlas.mjs';

export function drawSaibaman(ctx, x, y, size, height, time, moving, facing, phase, attackProgress = null) {
  if (attackProgress !== null && drawAttack(ctx, 'saibaman', { x, y }, size + 8, height, facing, attackProgress)) return true;
  if (moving && drawWalk(ctx, 'saibaman', { x, y }, size, height, facing, time, phase)) return true;
  if (!loaded(art.saibaman)) return false;
  const bounce = moving ? Math.sin(time * 12) * 1.5 : 0;
  ctx.drawImage(art.saibaman, 371, 309, 512, 679,
    Math.round(x - size / 2), Math.round(y - height + 7 + bounce), size, height);
  return true;
}
