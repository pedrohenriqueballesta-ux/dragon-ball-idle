// Onde dá para andar em cada planeta. Namekusei usa a máscara gerada da imagem do solo
// (namek-passagem.mjs); os demais planetas são livres.
import { NAMEK_PASSAGEM } from './namek-passagem.mjs';

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

const MASCARAS = { namek: { ...NAMEK_PASSAGEM, grade: decodificar(NAMEK_PASSAGEM) } };

export function podeAndar(planet, x, y) {
  const m = MASCARAS[planet];
  if (!m) return true;
  const cx = Math.floor(x / m.cellW), cy = Math.floor(y / m.cellH);
  if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows) return false;
  return m.grade[cy * m.cols + cx] === 1;
}

// Pés do personagem: centro e quatro pontos a 60% do raio. Evita encostar o corpo na água
// sem exigir que o círculo inteiro caiba (o que travaria em trilhas estreitas).
export function pesLivres(planet, x, y, radius) {
  const r = radius * 0.6;
  return podeAndar(planet, x, y) && podeAndar(planet, x + r, y) && podeAndar(planet, x - r, y)
    && podeAndar(planet, x, y + r) && podeAndar(planet, x, y - r);
}
