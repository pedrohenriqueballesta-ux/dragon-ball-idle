import test from 'node:test';
import assert from 'node:assert/strict';
import { clampZoom, zoomFromWheel, cameraView, worldFromPointer, spriteFacing, walkStep, DIRECTIONS, strikeFrame, mobStrikeProgress, advancePose } from '../public/render/camera.mjs';

test('roda do mouse aproxima para cima, afasta para baixo e respeita os limites', () => {
  assert.ok(zoomFromWheel(1, -120) > 1);
  assert.ok(zoomFromWheel(1, 120) < 1);
  assert.equal(zoomFromWheel(2, -5000), 2);
  assert.equal(zoomFromWheel(0.65, 5000), 0.65);
  assert.equal(zoomFromWheel(1, 3, 1), zoomFromWheel(1, 48, 0));
  assert.equal(clampZoom(NaN), 1);
});

test('câmera mantém a mira correta depois do zoom e respeita as bordas do mapa', () => {
  const character = { x: 1500, y: 900 };
  for (const zoom of [0.65, 1, 2]) {
    const camera = cameraView(character, 1000, 600, zoom, 3300, 2200);
    const target = worldFromPointer(520, 330, { left: 20, top: 30 }, camera);
    assert.ok(Math.abs(target.x - character.x) < 1e-8);
    assert.ok(Math.abs(target.y - character.y) < 1e-8);
  }
  const edge = cameraView({ x: 0, y: 0 }, 1000, 600, 1, 3300, 2200);
  assert.equal(edge.x, 0); assert.equal(edge.y, 0);
});

test('as oito direções distinguem os quatro quadrantes diagonais', () => {
  for (const [index, direction] of DIRECTIONS.entries()) assert.equal(spriteFacing(direction), index, direction.label);
  assert.equal(spriteFacing({ x: 10, y: -10 }), 5);
  assert.equal(spriteFacing({ x: 0.01, y: -1 }), 4);
  assert.equal(spriteFacing({ x: 1, y: 0.01 }), 6);
  assert.equal(spriteFacing({ x: 0, y: 0 }), 0);
});

test('um ciclo completo percorre os dezesseis quadros e volta ao início', () => {
  assert.deepEqual(Array.from({ length: 16 }, (_, i) => walkStep(i * 6, 96)), Array.from({ length: 16 }, (_, i) => i));
  assert.equal(walkStep(96, 96), 0);
  assert.equal(walkStep(48, 96), 8);
  assert.equal(walkStep(0, 96, 0.5), 8);
  assert.equal(strikeFrame(1), 15);
  assert.equal(strikeFrame(0.5), 8);
});

test('os passos acompanham distância, congelam sem deslocamento e reiniciam em teleporte', () => {
  const entity = { x: 1000, y: 700, moving: true, facing: { x: 1, y: -1 } };
  let pose = advancePose(null, entity, 1 / 60);
  for (let i = 0; i < 60; i++) pose = advancePose(pose, entity, 1 / 60);
  assert.equal(pose.travelled, 0, 'intenção sem movimento não anima as pernas');
  entity.x += 30; entity.y -= 30;
  pose = advancePose(pose, entity, 1);
  assert.ok(Math.abs(pose.travelled - Math.hypot(30, 30)) < 1e-8);
  assert.equal(spriteFacing(pose.facing), 5);
  const travelled = pose.travelled;
  entity.moving = false;
  pose = advancePose(pose, entity, 1);
  assert.equal(pose.travelled, travelled);
  assert.equal(spriteFacing(pose.facing), 5, 'parar mantém a orientação');
  entity.x += 500;
  pose = advancePose(pose, entity, 1);
  assert.equal(pose.travelled, 0);
});

test('a animação do mob preserva o instante de impacto e completa a recuperação', () => {
  const strike = { started: 100, release: 101, until: 101.32 };
  assert.equal(mobStrikeProgress(strike, 99), null);
  assert.equal(strikeFrame(mobStrikeProgress(strike, 100)), 0);
  assert.equal(strikeFrame(mobStrikeProgress(strike, 100.99)), 7);
  assert.equal(strikeFrame(mobStrikeProgress(strike, 101)), 8);
  assert.equal(strikeFrame(mobStrikeProgress(strike, 101.31)), 15);
  assert.equal(mobStrikeProgress(strike, 101.32), null);
});
