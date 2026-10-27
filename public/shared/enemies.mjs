// Inimigos do protótipo e onde eles aparecem no mapa.
// Para ajustar atributos ou adicionar um inimigo, mexa só neste arquivo.

// Atributos de cada tipo de inimigo. A Cratera Rubra tem versões mais fortes.
export function mobStats(type, zone = 'campos') {
  if (type === 'boss') return { hp: 650, attack: 30, xp: 140, speed: 80, name: 'Guardião da Cratera' };
  if (type === 'ranged') return { hp: zone === 'cratera' ? 105 : 60, attack: 12, xp: 17, speed: 108, name: 'Sentinela alienígena' };
  return { hp: zone === 'cratera' ? 90 : 42, attack: zone === 'cratera' ? 15 : 8, xp: zone === 'cratera' ? 18 : 10, speed: 115, name: 'Saibaman' };
}

// Pontos de nascimento dos inimigos no mundo. Recebe a função de aleatoriedade
// do jogo para manter a simulação determinística nos testes.
export function spawnPoints(random) {
  const points = [];
  for (let i = 0; i < 14; i++) {
    const x = 1000 + (i % 5) * 290 + random() * 65;
    const y = 500 + Math.floor(i / 5) * 235 + random() * 60;
    points.push({ type: i % 4 === 3 ? 'ranged' : 'melee', x, y, zone: 'campos' });
  }
  for (let i = 0; i < 8; i++) points.push({ type: i % 3 === 0 ? 'ranged' : 'melee', x: 1100 + (i % 4) * 290, y: 1490 + Math.floor(i / 4) * 320, zone: 'cratera' });
  points.push({ type: 'boss', x: 2370, y: 1640, zone: 'cratera' });
  return points;
}
