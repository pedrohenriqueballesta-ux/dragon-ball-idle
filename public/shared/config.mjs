// Dados do mundo e números de balanceamento do protótipo. Todos ajustáveis.
export const CONFIG = Object.freeze({
  width: 3300, height: 2200, foodDuration: 300, foodHealPerSecond: 2,
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
export const OBSTACLES = [
  { x: 180, y: 180, r: 42, type: 'tree' }, { x: 610, y: 180, r: 42, type: 'tree' },
  { x: 165, y: 515, r: 44, type: 'tree' }, { x: 660, y: 570, r: 38, type: 'tree' },
  { x: 850, y: 430, r: 32, type: 'rock' }, { x: 1220, y: 310, r: 45, type: 'tree' },
  { x: 1730, y: 380, r: 40, type: 'tree' }, { x: 2220, y: 250, r: 40, type: 'tree' },
  { x: 2050, y: 830, r: 38, type: 'rock' }, { x: 1430, y: 890, r: 48, type: 'tree' },
  { x: 2410, y: 1100, r: 46, type: 'tree' }, { x: 980, y: 1120, r: 40, type: 'tree' },
  { x: 1010, y: 1530, r: 44, type: 'rock' }, { x: 1360, y: 1840, r: 50, type: 'rock' },
  { x: 2130, y: 1460, r: 46, type: 'rock' }, { x: 2440, y: 1890, r: 44, type: 'rock' },
  { x: 2750, y: 120, r: 38, type: 'rock' }, { x: 2660, y: 2060, r: 45, type: 'tree' }
];
export function zoneAt(x, y) {
  return ZONES.find(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) || null;
}
