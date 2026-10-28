// A coherent 16-phase gait. The same drawing supplies every phase: no changing faces/volumes.
export const WALK_FRAMES = 16;
export function legPose(frame, side, direction, height = 96) {
  const a = ((frame % WALK_FRAMES) / WALK_FRAMES + (side ? 0.5 : 0)) * Math.PI * 2;
  const length = Math.hypot(direction.x, direction.y) || 1;
  const dx = direction.x / length, dy = direction.y / length;
  const forward = Math.cos(a), lift = Math.max(0, Math.sin(a));
  return {
    // 0.10 da altura: com 0.13 a passada lateral abria quase em espacate nas pernas curtas.
    x: dx * forward * height * 0.10,
    y: dy * forward * height * 0.052 - lift * height * 0.085,
    bend: (Math.abs(dx) > 0.4 ? dx : (side ? 1 : -1) * 0.45) * lift * height * 0.055,
    lift
  };
}

// Subida do corpo, em fração da altura: zero com as pernas abertas (quadros 0 e 8),
// máxima quando uma perna passa pela outra (quadros 4 e 12).
export const WALK_BOB = 0.025;
export function walkBob(frame) {
  return Math.abs(Math.sin((frame % WALK_FRAMES) / WALK_FRAMES * Math.PI * 2)) * WALK_BOB;
}

// Construct once per character/view; render cheaply from a cached 16-frame Canvas atlas.
export function makeWalkAtlas(image, data, row, direction, kind) {
  const frame = data.frames[row][0];
  const [sx, sy, sw, sh, ax, ay] = frame;
  const height = 96, scale = height / data.referenceHeight;
  const cell = 160, ground = 140, center = 80;
  const source = document.createElement('canvas'); source.width = cell; source.height = cell;
  const painter = source.getContext('2d', { willReadFrequently: true }); painter.imageSmoothingEnabled = false;
  painter.drawImage(image, sx, sy, sw, sh, center + (sx - ax) * scale, ground + (sy - ay) * scale, sw * scale, sh * scale);
  const hip = ground - height * (kind === 'saibaman' ? 0.27 : 0.30);
  const pixels = painter.getImageData(0, 0, cell, cell).data;
  // Locate the pelvis and the gap between the feet in this fixed drawing.
  const bounds = y => {
    let l = cell, r = 0;
    for (let x = 0; x < cell; x++) if (pixels[(Math.round(y) * cell + x) * 4 + 3] > 100) { l = Math.min(l, x); r = Math.max(r, x); }
    return l <= r ? (l + r) / 2 : center;
  };
  const splitTop = bounds(hip + 1), splitBottom = bounds(ground - 3);
  const limbs = [0, 1].map(side => {
    const part = document.createElement('canvas'); part.width = cell; part.height = cell;
    const c = part.getContext('2d'); c.imageSmoothingEnabled = false;
    c.beginPath(); c.moveTo(splitTop, hip - 3);
    c.lineTo(side ? cell : 0, hip - 3); c.lineTo(side ? cell : 0, cell);
    c.lineTo(splitBottom, cell); c.closePath(); c.clip(); c.drawImage(source, 0, 0);
    const rgba = c.getImageData(0, 0, cell, cell).data;
    let bottom = Math.floor(hip), sumX = 0, count = 0;
    for (let y = Math.floor(hip); y < ground + 3; y++) for (let x = 0; x < cell; x++)
      if (rgba[(y * cell + x) * 4 + 3] > 100) bottom = Math.max(bottom, y);
    for (let y = Math.max(Math.floor(hip), bottom - 4); y <= bottom; y++) for (let x = 0; x < cell; x++)
      if (rgba[(y * cell + x) * 4 + 3] > 100) { sumX += x; count++; }
    const footX = count ? sumX / count : splitTop;
    const neutralX = splitTop + (side ? 1 : -1) * height * 0.06 * Math.abs(direction.y);
    return { image: part, bottom, neutralX: neutralX - footX, neutralY: ground - bottom };
  });
  const atlas = document.createElement('canvas'); atlas.width = cell * WALK_FRAMES; atlas.height = cell;
  const c = atlas.getContext('2d'); c.imageSmoothingEnabled = false;
  for (let f = 0; f < WALK_FRAMES; f++) {
    c.save(); c.translate(f * cell, 0); c.beginPath(); c.rect(0, 0, cell, cell); c.clip();
    for (const side of [1, 0]) {
      const pose = legPose(f, side, direction, height);
      const limb = limbs[side];
      for (let y = Math.floor(hip - 3); y <= limb.bottom; y++) {
        const t = Math.max(0, Math.min(1, (y - hip) / (limb.bottom - hip)));
        const next = Math.max(0, Math.min(1, (y + 1 - hip) / (limb.bottom - hip)));
        const offsetX = (pose.x + limb.neutralX) * t + pose.bend * Math.sin(Math.PI * t);
        const y0 = y + (pose.y + limb.neutralY) * t, y1 = y + 1 + (pose.y + limb.neutralY) * next;
        c.drawImage(limb.image, 0, y, cell, 1, offsetX, y0, cell, Math.max(0.1, y1 - y0) + 0.4);
      }
    }
    // Head, hair, face, arms and torso remain exactly the same across the cycle.
    c.drawImage(source, 0, 0, cell, hip, 0, 0, cell, hip);
    c.restore();
  }
  return { image: atlas, cell, center, ground, hip, referenceHeight: height };
}

export function auditWalkAtlas(rig) {
  const c = rig.image.getContext('2d');
  const hash = (f, y, h) => {
    let result = 2166136261;
    for (const byte of c.getImageData(f * rig.cell, y, rig.cell, h).data) result = Math.imul(result ^ byte, 16777619);
    return result >>> 0;
  };
  const upper = [], lower = [], split = Math.floor(rig.hip);
  for (let f = 0; f < WALK_FRAMES; f++) { upper.push(hash(f, 0, split)); lower.push(hash(f, split, rig.cell - split)); }
  return { stableTorso: new Set(upper).size === 1, legPhases: new Set(lower).size };
}
