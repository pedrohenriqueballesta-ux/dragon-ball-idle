import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLANETS } from '../public/shared/index.mjs';
import { naEscala } from '../public/shared/config.mjs';
import { podeAndar, emTerra } from '../public/shared/passagem.mjs';

const world = () => new Game({ now: 1000, populate: false, random: () => 0.99 });

test('Namekusei: mar bloqueia, praça da Vila e chegada são caminháveis, Terra é livre', () => {
  assert.equal(podeAndar('namek', 60, 60), false, 'canto do mapa é mar');
  // Pontos em px da imagem do solo, levados para o mundo pela escala.
  assert.equal(podeAndar('namek', naEscala(3000), naEscala(1860)), false, 'mar entre a nave e o campo de batalha');
  assert.equal(podeAndar('namek', naEscala(1140), naEscala(2940)), false, 'mar ao sul');
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

test('regiões e mobs de Namekusei ficam em terra firme, e o mercador na Vila', async () => {
  const { ZONES, MERCHANT } = await import('../public/shared/config.mjs');
  const game = new Game({ now: 1000, random: () => 0.5 });
  const mobs = [...game.mobs.values()];
  assert.ok(mobs.filter(m => m.zone === 'campos').length >= 12, 'Planícies com mobs suficientes');
  assert.ok(mobs.filter(m => m.zone === 'cratera').length >= 8, 'Campo de Batalha com mobs suficientes');
  for (const m of mobs) assert.equal(podeAndar('namek', m.x, m.y), true, m.name + ' nasceu na água');
  assert.equal(podeAndar('namek', MERCHANT.x, MERCHANT.y), true);
  const vila = ZONES.find(z => z.id === 'vila');
  assert.ok(MERCHANT.x > vila.x && MERCHANT.x < vila.x + vila.w && MERCHANT.y > vila.y && MERCHANT.y < vila.y + vila.h, 'mercador dentro da Vila');
  const { x, y } = PLANETS.namek.spawn;
  assert.ok(x > vila.x && x < vila.x + vila.w && y > vila.y && y < vila.y + vila.h, 'chegada dentro da Vila (segura)');
});

test('casas da Vila bloqueiam pela base, ficam em terra e não tapam a chegada nem o mercador', async () => {
  const { HOUSES, MERCHANT } = await import('../public/shared/config.mjs');
  assert.ok(HOUSES.length >= 4);
  for (const c of HOUSES) {
    assert.equal(podeAndar('namek', c.x, c.y - c.w * 0.15), false, 'meio da base da casa ' + c.sprite + ' bloqueia');
    assert.equal(podeAndar('namek', c.x, c.y + 20), true, 'frente da porta da casa ' + c.sprite + ' fica livre');
  }
  const { x, y } = PLANETS.namek.spawn;
  assert.equal(podeAndar('namek', x, y), true);
  assert.equal(podeAndar('namek', MERCHANT.x, MERCHANT.y), true);
});

test('casas da Vila ficam em solo firme, longe da beira da água', async () => {
  const { HOUSES } = await import('../public/shared/config.mjs');
  for (const c of HOUSES) for (let dx = -c.w * 0.6; dx <= c.w * 0.6; dx += 20) for (const dy of [-c.w * 0.5, 0, c.w * 0.3])
    assert.ok(emTerra('namek', c.x + dx, c.y + dy), 'casa ' + c.sprite + ' perto da água em ' + Math.round(dx) + ',' + Math.round(dy));
});

test('casas destruídas ficam no Campo de Batalha, em terra, longe do chefe', async () => {
  const { HOUSES, ZONES } = await import('../public/shared/config.mjs');
  const campo = ZONES.find(z => z.id === 'cratera'), ruinas = HOUSES.filter(c => c.ruina);
  assert.equal(ruinas.length, 6);
  const game = new Game({ now: 1000, random: () => 0.5 }), chefe = [...game.mobs.values()].find(m => m.type === 'boss');
  for (const c of ruinas) {
    assert.ok(c.x > campo.x && c.x < campo.x + campo.w && c.y > campo.y && c.y < campo.y + campo.h, 'ruína ' + c.sprite + ' fora do Campo de Batalha');
    assert.ok(emTerra('namek', c.x, c.y));
    assert.ok(Math.hypot(c.x - chefe.x, c.y - chefe.y) > c.w / 2 + 200, 'ruína ' + c.sprite + ' em cima do chefe');
  }
  for (const m of game.mobs.values()) assert.equal(podeAndar('namek', m.x, m.y), true, m.name + ' nasceu dentro de uma casa');
});
