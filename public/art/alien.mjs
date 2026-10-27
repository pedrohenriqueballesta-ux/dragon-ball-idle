// Desenho da Sentinela alienígena (inimigo à distância), com caminhada e ataque.
import { art, loaded } from './assets.mjs';
import { drawWalk, drawAttack } from './atlas.mjs';

export function drawAlien(ctx, x, y, size, height, time, moving, facing, phase, attackProgress = null) {
  if (attackProgress !== null && drawAttack(ctx, 'alien', { x, y }, size + 8, height, facing, attackProgress)) return true;
  if (moving && drawWalk(ctx, 'alien', { x, y }, size, height, facing, time, phase)) return true;
  if (!loaded(art.alien)) return false;
  const bounce = moving ? Math.sin(time * 11) * 1.5 : 0;
  ctx.drawImage(art.alien, 228, 107, 800, 1044,
    Math.round(x - size / 2), Math.round(y - height + 7 + bounce), size, height);
  return true;
}
