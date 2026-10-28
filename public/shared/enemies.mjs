// Inimigos do protótipo e onde eles aparecem no mapa.
// Para ajustar atributos ou adicionar um inimigo, mexa só neste arquivo.

import { ZONES, naEscala } from './config.mjs';
import { podeAndar } from './passagem.mjs';

// Atributos de cada tipo de inimigo. O Campo de Batalha ('cratera') tem versões mais fortes.
// O chefe (boss) é o Freeza.
export function mobStats(type, zone = 'campos') {
  if (type === 'boss') return { hp: 650, attack: 30, xp: 140, speed: 80, name: 'Freeza · Boss' };
  if (type === 'ranged') return { hp: zone === 'cratera' ? 105 : 60, attack: 12, xp: 17, speed: 108, name: 'Sentinela alienígena' };
  return { hp: zone === 'cratera' ? 90 : 42, attack: zone === 'cratera' ? 15 : 8, xp: zone === 'cratera' ? 18 : 10, speed: 115, name: 'Saibaman' };
}

// Pontos de nascimento dos inimigos: uma grade dentro de cada região, ficando só os pontos
// em terra firme (máscara de passagem) e com folga da água. O sorteio só desloca cada ponto
// um pouco, então funciona até com aleatoriedade fixa (testes). A grade acompanha a escala do
// mundo; a folga da água (24) é do tamanho do mob e não cresce.
const em_terra = (x, y) => [[0, 0], [24, 0], [-24, 0], [0, 24], [0, -24]].every(([dx, dy]) => podeAndar('namek', x + dx, y + dy));
function espalhar(random, zone, n, tipo) {
  const z = ZONES.find(z => z.id === zone), candidatos = [];
  const passo = naEscala(170), margem = naEscala(90), fim = naEscala(60), sorteio = naEscala(60);
  for (let y = z.y + margem; y < z.y + z.h - fim; y += passo) for (let x = z.x + margem; x < z.x + z.w - fim; x += passo) {
    const px = x + (random() - 0.5) * sorteio, py = y + (random() - 0.5) * sorteio;
    if (em_terra(px, py)) candidatos.push({ x: px, y: py });
  }
  // Pega n pontos bem distribuídos ao longo da lista (em vez dos n primeiros, que ficariam todos no topo).
  const salto = Math.max(1, candidatos.length / n);
  return Array.from({ length: Math.min(n, candidatos.length) }, (_, i) => ({ ...candidatos[Math.floor(i * salto)], type: tipo(i), zone }));
}
export function spawnPoints(random) {
  return [
    ...espalhar(random, 'campos', 16, i => i % 4 === 3 ? 'ranged' : 'melee'),
    ...espalhar(random, 'cratera', 10, i => i % 3 === 0 ? 'ranged' : 'melee'),
    // Freeza junto à cratera grande do campo de batalha.
    { type: 'boss', x: naEscala(3330), y: naEscala(2280), zone: 'cratera' }
  ];
}
