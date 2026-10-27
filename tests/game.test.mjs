import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, CONFIG, statsFor, xpForLevel, bagWeight } from '../public/engine.mjs';
import { createGameServer } from '../server.mjs';

const world = () => new Game({ now: 1000, populate: false, random: () => 0.99 });
function advance(game, seconds) { for (let i = 0; i < Math.ceil(seconds / 0.05); i++) game.tick(0.05); }

test('sementes de potências diferentes compartilham a recarga, sem consumir item ao bloquear', () => {
  const game = world(), p = game.addPlayer('a'); p.hp = 10;
  assert.equal(game.useSeed(p, 15).ok, true);
  assert.equal(p.hp, 28);
  const count = p.inventory.seed100;
  assert.equal(game.useSeed(p, 100).ok, false);
  assert.equal(p.inventory.seed100, count);
  assert.equal(p.hp, 28);
  advance(game, CONFIG.seedCooldown + 0.1);
  assert.equal(game.useSeed(p, 100).ok, true);
  assert.equal(p.hp, p.stats.hp);
});

test('vida só regenera com comida ativa e o efeito termina após cinco minutos', () => {
  const game = world(), p = game.addPlayer('a'); p.hp = 10;
  advance(game, 10); assert.equal(p.hp, 10);
  const food = p.inventory.food;
  assert.equal(game.useFood(p).ok, true);
  assert.equal(p.inventory.food, food - 1);
  advance(game, 10); assert.ok(Math.abs(p.hp - 30) < 0.01);
  assert.equal(game.useFood(p).ok, false, 'comida ativa não empilha');
  advance(game, 291); p.hp = 10; advance(game, 1);
  assert.equal(p.hp, 10);
});

test('subir de nível aumenta todos os atributos automaticamente e libera técnicas', () => {
  const game = world(), p = game.addPlayer('a'), before = { ...p.stats };
  assert.equal(game.cast(p, 'ki').ok, false);
  game.awardXp(p, xpForLevel(1));
  assert.equal(p.level, 2);
  for (const key of Object.keys(before)) assert.ok(p.stats[key] > before[key], key + ' deve aumentar');
  assert.equal(game.cast(p, 'ki').ok, true);
  assert.equal(game.cast(p, 'kame').ok, false);
  game.awardXp(p, xpForLevel(2));
  assert.equal(game.cast(p, 'kame').ok, true);
});

test('PvP é recusado fora da região e permitido com os dois jogadores na área PvP', () => {
  const game = world(), a = game.addPlayer('a'), b = game.addPlayer('b');
  assert.equal(game.hit(a, b, 30), false); assert.equal(b.hp, b.stats.hp);
  a.x = 2800; a.y = 800; b.x = 2840; b.y = 800;
  assert.equal(game.hit(a, b, 30), true); assert.ok(b.hp < b.stats.hp);
  b.x = 2700; const hp = b.hp;
  assert.equal(game.hit(a, b, 30), false); assert.equal(b.hp, hp);
});

test('Kamehameha atravessando a fronteira não causa dano em jogador fora da área PvP', () => {
  const game = world(), a = game.addPlayer('a', 'Goku', { level: 3 }), b = game.addPlayer('b');
  a.x = 2800; a.y = 800; b.x = 2700; b.y = 800; a.aim = { x: b.x, y: b.y };
  assert.equal(game.cast(a, 'kame').ok, true);
  advance(game, 0.8); assert.equal(b.hp, b.stats.hp);
});

test('mochila respeita capacidade de peso e uma compra bloqueada não gasta Zeni', () => {
  const game = world(), p = game.addPlayer('a'); p.y = 300;
  p.stats.capacity = bagWeight(p.inventory);
  const count = p.inventory.food, money = p.zeni;
  assert.equal(game.buy(p, 'food').ok, false);
  assert.equal(p.inventory.food, count); assert.equal(p.zeni, money);
});

test('movimento manual interrompe a caça e desconexão suspende evolução AFK', () => {
  const game = world(), p = game.addPlayer('a');
  game.action(p.id, { type: 'hunt', zone: 'campos' }); assert.equal(p.autoHunt, true);
  game.setInput(p.id, { x: 1, y: 0 }); assert.equal(p.autoHunt, false);
  p.connected = false; p.hp = 20; p.foodUntil = game.time + 50;
  advance(game, 5); assert.equal(p.hp, 20);
});

test('transformação exige nível e termina quando o Ki acaba', () => {
  const game = world(), low = game.addPlayer('a'), high = game.addPlayer('b', 'Goku', { level: 5 });
  assert.equal(game.action(low.id, { type: 'transform' }).ok, false);
  assert.equal(game.action(high.id, { type: 'transform' }).ok, true);
  high.ki = 0.1; advance(game, 0.1); assert.equal(high.transformed, false);
});

test('caça automática sustenta uma sessão inicial, derrota mobs e evolui sem entrada manual', () => {
  const game = new Game({ now: 1000, random: () => 0.5 });
  const p = game.addPlayer('a');
  game.action(p.id, { type: 'hunt', zone: 'campos' });
  advance(game, 60);
  assert.ok(p.kills >= 10);
  assert.ok(p.level >= 3);
  assert.ok(p.hp > 0);
  assert.equal(p.autoHunt, true);
  assert.equal(p.inventory.food, 4);
});

test('duas sessões HTTP reais recebem o mundo compartilhado e entradas não alteram atributos', async () => {
  const app = await createGameServer({ port: 0, dataDir: null });
  const base = 'http://127.0.0.1:' + app.port;
  const post = async (path, data, token) => {
    const res = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(data) });
    return { status: res.status, value: await res.json() };
  };
  const controllers = [];
  try {
    const a = (await post('/api/join', { name: 'Jogador A' })).value;
    const b = (await post('/api/join', { name: 'Jogador B' })).value;
    assert.notEqual(a.playerId, b.playerId);
    assert.notEqual(a.token, b.token);
    for (const session of [a, b]) {
      const controller = new AbortController(); controllers.push(controller);
      const res = await fetch(base + '/api/events?session=' + session.token, { signal: controller.signal });
      assert.equal(res.status, 200); const reader = res.body.getReader(); let text = '';
      while (!text.includes('data: ')) text += new TextDecoder().decode((await reader.read()).value);
      const first = JSON.parse(text.split('data: ')[1].split('\n')[0]);
      assert.equal(first.players.length, 2);
      assert.ok(first.players.some(p => p.id === a.playerId));
      assert.ok(first.players.some(p => p.id === b.playerId));
    }
    await post('/api/input', { x: 1, y: 0, hp: 99999, level: 100 }, a.token);
    assert.equal(app.game.players.get(a.playerId).level, 1);
    assert.equal(app.game.players.get(a.playerId).stats.hp, statsFor(1).hp);
    const unauthorized = await post('/api/action', { type: 'seed' }, 'inventado');
    assert.equal(unauthorized.status, 401);
  } finally { controllers.forEach(c => c.abort()); await app.close(); }
});
