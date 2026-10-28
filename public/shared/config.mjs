// Dados do mundo e números de balanceamento do protótipo. Todos ajustáveis.
export const CONFIG = Object.freeze({
  // Namekusei: 4608x3072, o tamanho da imagem do solo (assets/namek/solo.webp, 1 px = 1 unidade).
  width: 4608, height: 3072, foodDuration: 300, foodHealPerSecond: 2,
  seedCooldown: 20, kiCooldown: 8, pickupRadius: 60, respawnDelay: 4,
  seedPotencies: [15, 30, 50, 100],
  itemWeights: { food: 0.35, ki: 0.2, seed15: 0.08, seed30: 0.08, seed50: 0.08, seed100: 0.08, scrap: 0.7, crystal: 0.45 },
  prices: { food: 12, ki: 18, seed15: 90, seed30: 210, seed50: 480, seed100: 1400 },
  skillCosts: { kame: 25, kaioken: 12, barrier: 30, transform: 60, genki: 60 },
  skillCooldowns: { kame: 5, kaioken: 12, barrier: 8, transform: 30, genki: 45 },
  skills: { ki: 2, dash: 2, kame: 3, kaioken: 2, barrier: 2, transform: 5, genki: 10 }
});
// Regiões de Namekusei, posicionadas sobre o mapa da lore (assets/namek/solo.webp).
// Os ids são usados pelas regras (vila = segura, campos/cratera = caça, arena = PvP): mude
// posição e nome à vontade, mas não os ids.
export const ZONES = [
  { id: 'vila', name: 'Vila Namekiana', x: 150, y: 1050, w: 750, h: 600, pvp: false },
  { id: 'campos', name: 'Planícies de Namekusei', x: 1250, y: 580, w: 1900, h: 1220, pvp: false },
  { id: 'cratera', name: 'Campo de Batalha', x: 1350, y: 1850, w: 2800, h: 950, pvp: false },
  { id: 'arena', name: 'Planalto da Nave do Freeza', x: 3450, y: 650, w: 1100, h: 1100, pvp: true }
];
// Mercador na beira da praça da Vila Namekiana.
export const MERCHANT = { x: 560, y: 1290 };
// Árvores e pedras do mapa antigo saíram com o solo novo de Namekusei (28/10).
// Os novos obstáculos entram nas próximas etapas, posicionados sobre a imagem do solo.
export const OBSTACLES = [];
export function zoneAt(x, y) {
  return ZONES.find(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) || null;
}
// Casas dos namekuseijins na Vila (sprites em assets/namek/casas/casa_N.png), no tamanho original.
// Cada uma fica num terreiro de terra batida pintado no próprio solo.webp por
// ~/idle-dbz/ferramentas/assentar_casas.py: ao mudar posição ou tamanho aqui, gere o solo de novo.
// x, y = centro da base da casa no chão; w = largura desenhada (a altura segue a proporção do sprite).
export const HOUSES = [
  { sprite: 2, x: 525, y: 1615, w: 190 },
  { sprite: 4, x: 285, y: 1405, w: 150 },
  { sprite: 5, x: 765, y: 1330, w: 240 },
  { sprite: 6, x: 525, y: 1075, w: 290 },
  // Casas destruídas na luta contra o Freeza, no Campo de Batalha (assets/namek/ruinas/ruina_N.png).
  { sprite: 1, x: 1760, y: 2470, w: 150, ruina: true },
  { sprite: 3, x: 2260, y: 2410, w: 300, ruina: true },
  { sprite: 5, x: 2660, y: 2230, w: 240, ruina: true },
  { sprite: 6, x: 2980, y: 2510, w: 290, ruina: true },
  { sprite: 4, x: 3400, y: 2650, w: 150, ruina: true },
  { sprite: 2, x: 3700, y: 2370, w: 190, ruina: true }
];
// A parte da casa que ocupa o chão: um retângulo raso na base, recuado nas laterais.
export function casaBloqueia(x, y) {
  return HOUSES.some(c => Math.abs(x - c.x) < c.w * 0.42 && y < c.y - 6 && y > c.y - c.w * 0.32);
}
// Planetas (instâncias). 'terra' é o spawn verde pequeno e seguro (tela inicial);
// 'namek' é o mundo atual com zonas, inimigos e combate. Só se troca de planeta por TP.
export const PLANETS = {
  terra: { id: 'terra', name: 'Terra', w: 1100, h: 760, spawn: { x: 550, y: 380 } },
  namek: { id: 'namek', name: 'Namekusei', w: CONFIG.width, h: CONFIG.height, spawn: { x: 480, y: 1410 } } // praça da Vila Namekiana
};
