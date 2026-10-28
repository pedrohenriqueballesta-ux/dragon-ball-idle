// Dados do mundo e números de balanceamento do protótipo. Todos ajustáveis.
export const CONFIG = Object.freeze({
  // Namekusei: 3x a imagem do solo (1536x1024 → 4608x3072), cerca de 2x a área do mapa antigo.
  width: 4608, height: 3072, foodDuration: 300, foodHealPerSecond: 2,
  seedCooldown: 20, kiCooldown: 8, pickupRadius: 60, respawnDelay: 4,
  seedPotencies: [15, 30, 50, 100],
  itemWeights: { food: 0.35, ki: 0.2, seed15: 0.08, seed30: 0.08, seed50: 0.08, seed100: 0.08, scrap: 0.7, crystal: 0.45 },
  prices: { food: 12, ki: 18, seed15: 90, seed30: 210, seed50: 480, seed100: 1400 },
  skillCosts: { kame: 25, kaioken: 12, barrier: 30, transform: 60, genki: 60 },
  skillCooldowns: { kame: 5, kaioken: 12, barrier: 8, transform: 30, genki: 45 },
  skills: { ki: 2, dash: 2, kame: 3, kaioken: 2, barrier: 2, transform: 5, genki: 10 }
});
export const ZONES = [
  { id: 'vila', name: 'Vila do Lago', x: 70, y: 70, w: 650, h: 540, pvp: false },
  { id: 'campos', name: 'Campos da Terra', x: 800, y: 120, w: 1780, h: 1070, pvp: false },
  { id: 'cratera', name: 'Cratera Rubra', x: 700, y: 1320, w: 1880, h: 700, pvp: false },
  { id: 'arena', name: 'Fronteira de Combate', x: 2720, y: 220, w: 490, h: 1750, pvp: true }
];
export const MERCHANT = { x: 430, y: 300 };
// Árvores e pedras do mapa antigo saíram com o solo novo de Namekusei (28/10).
// Os novos obstáculos entram nas próximas etapas, posicionados sobre a imagem do solo.
export const OBSTACLES = [];
export function zoneAt(x, y) {
  return ZONES.find(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) || null;
}
// Planetas (instâncias). 'terra' é o spawn verde pequeno e seguro (tela inicial);
// 'namek' é o mundo atual com zonas, inimigos e combate. Só se troca de planeta por TP.
export const PLANETS = {
  terra: { id: 'terra', name: 'Terra', w: 1100, h: 760, spawn: { x: 550, y: 380 } },
  namek: { id: 'namek', name: 'Namekusei', w: CONFIG.width, h: CONFIG.height, spawn: { x: 480, y: 1410 } } // praça da Vila Namekiana
};
