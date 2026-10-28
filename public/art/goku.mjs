// Desenho do Goku (forma base e Super Saiyajin), com caminhada e golpe de 16 quadros.
import { art, loaded } from './assets.mjs';
import { drawWalk, drawAttack } from './atlas.mjs';

export function drawGoku(ctx, player, pos, time, strikeProgress = null) {
  if (strikeProgress !== null && !player.dead && !player.charge &&
      drawAttack(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, strikeProgress)) return true;
  if (player.charge && !player.dead &&
      drawAttack(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, 3 / 16)) return true;
  if (!player.dead && drawWalk(ctx, player.transformed ? 'ssj' : 'goku', pos, 70, player.facing, player.moving)) return true;
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
