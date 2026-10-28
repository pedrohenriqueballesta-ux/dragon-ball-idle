// Desenho do Saibaman (inimigo corpo a corpo), com caminhada e ataque de 16 quadros.
import { art, loaded } from './assets.mjs';
import { drawWalk, drawAttack } from './atlas.mjs';

export function drawSaibaman(ctx, x, y, size, height, time, moving, facing, phase, attackProgress = null, travelled = 0) {
  const pos = { x, y, travelled };
  if (attackProgress !== null && drawAttack(ctx, 'saibaman', pos, height, facing, attackProgress)) return true;
  if (drawWalk(ctx, 'saibaman', pos, height, facing, moving, 80, phase)) return true;
  if (!loaded(art.saibaman)) return false;
  const bounce = moving ? Math.sin(time * 12) * 1.5 : 0;
  ctx.drawImage(art.saibaman, 371, 309, 512, 679,
    Math.round(x - size / 2), Math.round(y - height + 7 + bounce), size, height);
  return true;
}
