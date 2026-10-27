// Recorte dos sprite sheets de caminhada e ataque, compartilhado por Goku e inimigos.
import { art, loaded } from './assets.mjs';
import { spriteFacing, walkStep } from '../render/camera.mjs';

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
export function drawWalk(ctx, kind, pos, width, height, facing, time, phase = 0) {
  return drawAtlas(ctx, WALK_ATLASES[kind], pos, width, height, facing, walkStep(time, phase));
}
export function drawAttack(ctx, kind, pos, width, height, facing, progress) {
  return drawAtlas(ctx, ATTACK_ATLASES[kind], pos, width, height, facing, progress < 0.5 ? 0 : 1);
}
