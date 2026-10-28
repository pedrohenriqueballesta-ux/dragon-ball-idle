// Onde dá para andar em cada planeta. Namekusei usa a máscara gerada da imagem do solo
// (namek-passagem.mjs); os demais planetas são livres.
import { NAMEK_PASSAGEM } from './namek-passagem.mjs';
import { ESCALA_MUNDO, OBSTACLES, PLANETS, casaBloqueia } from './config.mjs';

function decodificar({ cols, rows, linhas }) {
  const grade = new Uint8Array(cols * rows);
  linhas.forEach((linha, y) => {
    let x = 0, anda = true;
    for (const corrida of linha.split('.')) {
      const n = parseInt(corrida, 36);
      if (anda) grade.fill(1, y * cols + x, y * cols + x + n);
      x += n; anda = !anda;
    }
  });
  return grade;
}

// A máscara foi gerada em px da imagem do solo; cada célula cresce com a escala do mundo.
const MASCARAS = { namek: { ...NAMEK_PASSAGEM, cellW: NAMEK_PASSAGEM.cellW * ESCALA_MUNDO, cellH: NAMEK_PASSAGEM.cellH * ESCALA_MUNDO, grade: decodificar(NAMEK_PASSAGEM) } };

// Só o terreno (mar/lagos), sem contar casas e outras construções.
export function emTerra(planet, x, y) {
  const m = MASCARAS[planet];
  if (!m) return true;
  const cx = Math.floor(x / m.cellW), cy = Math.floor(y / m.cellH);
  return cx >= 0 && cy >= 0 && cx < m.cols && cy < m.rows && m.grade[cy * m.cols + cx] === 1;
}

export function podeAndar(planet, x, y) {
  const m = MASCARAS[planet];
  if (!m) return true;
  const cx = Math.floor(x / m.cellW), cy = Math.floor(y / m.cellH);
  if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows) return false;
  return m.grade[cy * m.cols + cx] === 1 && !(planet === 'namek' && casaBloqueia(x, y));
}

// Pés do personagem: centro e quatro pontos a 60% do raio. Evita encostar o corpo na água
// sem exigir que o círculo inteiro caiba (o que travaria em trilhas estreitas).
export function pesLivres(planet, x, y, radius) {
  const r = radius * 0.6;
  return podeAndar(planet, x, y) && podeAndar(planet, x + r, y) && podeAndar(planet, x - r, y)
    && podeAndar(planet, x, y + r) && podeAndar(planet, x, y - r);
}

// Um passo de movimento: eixo X e depois Y, cada um só se o destino estiver dentro do mundo,
// longe dos obstáculos e com os pés em terra. Servidor (Game.move) e predição do cliente usam
// esta mesma regra; se divergirem, o cliente anda onde o servidor não deixa e o personagem treme.
export function deslocar(planet, x, y, dx, dy, dist, radius = 15) {
  const world = PLANETS[planet] || PLANETS.namek, onNamek = planet === 'namek';
  // Quem já está num ponto bloqueado (save antigo, mob nascido na água) pode sair dele.
  const preso = !pesLivres(planet, x, y, radius);
  const livre = (nx, ny) => nx >= radius && ny >= radius && nx <= world.w - radius && ny <= world.h - radius
    && (!onNamek || !OBSTACLES.some(o => Math.hypot(o.x - nx, o.y - ny) < o.r + radius))
    && (preso || pesLivres(planet, nx, ny, radius));
  const nx = x + dx * dist, ny = y + dy * dist;
  if (livre(nx, y)) x = nx;
  if (livre(x, ny)) y = ny;
  return [x, y];
}

// Caminho por terra entre dois pontos (busca em largura numa grade grossa da máscara).
// Devolve a lista de pontos do mundo até o destino, ou null se não houver ligação por terra.
const PASSO_GRADE = 4;   // células da máscara por célula de busca (6 px * 4 = 24 unidades)
const cacheGrade = new Map();
function gradeBusca(planet) {
  if (cacheGrade.has(planet)) return cacheGrade.get(planet);
  const m = MASCARAS[planet];
  const cols = Math.floor(m.cols / PASSO_GRADE), rows = Math.floor(m.rows / PASSO_GRADE);
  const livre = new Uint8Array(cols * rows), cw = m.cellW * PASSO_GRADE, ch = m.cellH * PASSO_GRADE;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
    livre[y * cols + x] = pesLivres(planet, (x + 0.5) * cw, (y + 0.5) * ch, 15) ? 1 : 0;
  const g = { cols, rows, cw, ch, livre };
  cacheGrade.set(planet, g); return g;
}
function celulaLivreMaisProxima(g, cx, cy) {
  for (let r = 0; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = cx + dx, y = cy + dy;
    if (x >= 0 && y >= 0 && x < g.cols && y < g.rows && g.livre[y * g.cols + x]) return y * g.cols + x;
  }
  return -1;
}
export function caminhoPorTerra(planet, de, ate) {
  if (!MASCARAS[planet]) return null;
  const g = gradeBusca(planet);
  const ini = celulaLivreMaisProxima(g, Math.floor(de.x / g.cw), Math.floor(de.y / g.ch));
  const fim = celulaLivreMaisProxima(g, Math.floor(ate.x / g.cw), Math.floor(ate.y / g.ch));
  if (ini < 0 || fim < 0) return null;
  const veio = new Int32Array(g.cols * g.rows).fill(-1); veio[ini] = ini;
  const fila = new Int32Array(g.cols * g.rows); let a = 0, b = 0; fila[b++] = ini;
  const viz = [1, -1, g.cols, -g.cols, g.cols + 1, g.cols - 1, -g.cols + 1, -g.cols - 1];
  while (a < b) {
    const c = fila[a++]; if (c === fim) break;
    const cx = c % g.cols;
    for (const d of viz) {
      const n = c + d, nx = n % g.cols;
      if (n < 0 || n >= veio.length || Math.abs(nx - cx) > 1 || veio[n] >= 0 || !g.livre[n]) continue;
      veio[n] = c; fila[b++] = n;
    }
  }
  if (veio[fim] < 0) return null;
  const pontos = [];
  for (let c = fim; c !== ini; c = veio[c]) pontos.push({ x: (c % g.cols + 0.5) * g.cw, y: (Math.floor(c / g.cols) + 0.5) * g.ch });
  return pontos.reverse();
}
