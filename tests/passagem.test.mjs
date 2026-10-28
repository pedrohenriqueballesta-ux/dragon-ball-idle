import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLANETS } from '../public/shared/index.mjs';
import { podeAndar } from '../public/shared/passagem.mjs';

const world = () => new Game({ now: 1000, populate: false, random: () => 0.99 });

test('Namekusei: mar bloqueia, praça da Vila e chegada são caminháveis, Terra é livre', () => {
  assert.equal(podeAndar('namek', 60, 60), false, 'canto do mapa é mar');
  assert.equal(podeAndar('namek', 3000, 1860), false, 'mar entre a nave e o campo de batalha');
  assert.equal(podeAndar('namek', 1140, 2940), false, 'mar ao sul');
  const { x, y } = PLANETS.namek.spawn;
  assert.equal(podeAndar('namek', x, y), true, 'chegada na praça da Vila');
  assert.equal(podeAndar('terra', 60, 60), true);
});

test('o personagem para na beira da água e não entra no mar', () => {
  const game = world(), p = game.addPlayer('a');
  p.planet = 'namek'; p.x = PLANETS.namek.spawn.x; p.y = PLANETS.namek.spawn.y;
  for (let i = 0; i < 400; i++) { game.setInput(p.id, { x: -1, y: 0 }); game.tick(0.05); }
  assert.equal(podeAndar('namek', p.x, p.y), true, 'continua em terra');
  assert.ok(p.x > 15, 'parou antes da borda do mapa');
});

test('quem nasce dentro da água consegue sair dela', () => {
  const game = world(), p = game.addPlayer('a');
  p.planet = 'namek'; p.x = 60; p.y = 60;
  const x = p.x; game.setInput(p.id, { x: 1, y: 0 }); game.tick(0.1);
  assert.ok(p.x > x, 'não fica preso no mar');
});
