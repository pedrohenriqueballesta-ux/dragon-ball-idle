import test from 'node:test';
import assert from 'node:assert/strict';
import { clampZoom, zoomFromWheel, cameraView, worldFromPointer, spriteFacing, walkStep } from '../public/view.mjs';

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

test('direção e passos escolhem vistas e quadros alternados', () => {
  assert.deepEqual(spriteFacing({ x: 0, y: -1 }), { column: 1, flip: false });
  assert.deepEqual(spriteFacing({ x: 0, y: 1 }), { column: 0, flip: false });
  assert.deepEqual(spriteFacing({ x: 1, y: 0 }), { column: 3, flip: false });
  assert.deepEqual(spriteFacing({ x: -1, y: 0 }), { column: 3, flip: true });
  assert.notEqual(walkStep(1), walkStep(1 + 1 / 7));
});
