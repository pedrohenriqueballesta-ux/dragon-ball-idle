import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SPRITE_DATA } from '../public/art/sprite-data.mjs';

test('todos os personagens têm dezesseis recortes diferentes por direção, dentro do PNG', async () => {
  for (const kind of ['goku', 'ssj', 'saibaman', 'alien']) {
    for (const action of ['Walk', 'Attack', 'DiagonalWalk', 'DiagonalAttack']) {
      const data = SPRITE_DATA[kind + action];
      assert.equal(data.frameCount, 16);
      assert.equal(data.frames.length, action.startsWith('Diagonal') ? 2 : 8);
      const bytes = await readFile(new URL('../public' + data.file, import.meta.url));
      assert.equal(bytes.readUInt32BE(16), data.sourceWidth, data.file);
      assert.equal(bytes.readUInt32BE(20), data.sourceHeight, data.file);
      assert.equal(bytes[25], 6, 'PNG RGBA mantém transparência');
      for (const frames of data.frames) {
        assert.equal(frames.length, 16);
        assert.equal(new Set(frames.map(f => f.slice(0, 4).join(','))).size, 16, 'quadros não são oito índices repetidos');
        for (const [x, y, w, h, anchorX, anchorY] of frames) {
          assert.ok(w > 20 && h > 40);
          assert.ok(x >= 0 && y >= 0 && x + w <= data.sourceWidth && y + h <= data.sourceHeight);
          assert.ok(anchorX >= x && anchorX < x + w && anchorY >= y && anchorY < y + h);
        }
      }
    }
  }
});
