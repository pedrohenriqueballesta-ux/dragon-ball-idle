// Registro de imagens (sprites e texturas). As artes são separadas da
// simulação autoritativa, que vive em shared/.
const loadImage = url => { const image = new Image(); image.src = url; return image; };
export const art = {
  goku: loadImage('/assets/goku-sheet.png'),
  tree: loadImage('/assets/tree.png'),
  rock: loadImage('/assets/rock.png'),
  alien: loadImage('/assets/alien.png'),
  vendor: loadImage('/assets/vendor.png'),
  saibaman: loadImage('/assets/saibaman.png'),
  gokuWalk: loadImage('/assets/goku-walk.png'),
  ssjWalk: loadImage('/assets/ssj-walk.png'),
  saibamanWalk: loadImage('/assets/saibaman-walk.png'),
  alienWalk: loadImage('/assets/alien-walk.png'),
  gokuAttack: loadImage('/assets/goku-attack.png'),
  ssjAttack: loadImage('/assets/ssj-attack.png'),
  saibamanAttack: loadImage('/assets/saibaman-attack.png'),
  alienAttack: loadImage('/assets/alien-attack.png'),
  grass: loadImage('/assets/grass.png'),
  earth: loadImage('/assets/earth.png')
};

// Verdadeiro quando a imagem já carregou e pode ser desenhada.
export const loaded = image => image.complete && image.naturalWidth > 0;
