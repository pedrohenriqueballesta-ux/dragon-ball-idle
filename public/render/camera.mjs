// Camera and animation helpers do not change any server-authoritative rules.
export const MIN_ZOOM = 0.65;
export const MAX_ZOOM = 2;
export function clampZoom(value) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number.isFinite(value) ? value : 1));
}
export function zoomFromWheel(current, delta, mode = 0) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? 600 : 1);
  return clampZoom(current * Math.exp(-pixels * 0.0012));
}
export function cameraView(position, width, height, zoom, worldWidth, worldHeight) {
  const scale = (width < 650 ? 0.9 : 1.05) * clampZoom(zoom);
  const visibleWidth = width / scale, visibleHeight = height / scale;
  const axis = (value, extent, visible) => visible >= extent ? (extent - visible) / 2 : Math.max(0, Math.min(extent - visible, value - visible / 2));
  return { x: axis(position.x, worldWidth, visibleWidth), y: axis(position.y, worldHeight, visibleHeight), scale };
}
export function worldFromPointer(x, y, rect, camera) {
  return { x: (x - rect.left) / camera.scale + camera.x, y: (y - rect.top) / camera.scale + camera.y };
}
export const ANIMATION_FRAMES = 16;
// Clockwise in screen coordinates, starting at the bottom of the map.
export const DIRECTIONS = Object.freeze([
  { id: 's', label: 'Sul', x: 0, y: 1 },
  { id: 'sw', label: 'Sudoeste', x: -1, y: 1 },
  { id: 'w', label: 'Oeste', x: -1, y: 0 },
  { id: 'nw', label: 'Noroeste', x: -1, y: -1 },
  { id: 'n', label: 'Norte', x: 0, y: -1 },
  { id: 'ne', label: 'Nordeste', x: 1, y: -1 },
  { id: 'e', label: 'Leste', x: 1, y: 0 },
  { id: 'se', label: 'Sudeste', x: 1, y: 1 }
]);
export function spriteFacing(facing) {
  const x = Number.isFinite(facing?.x) ? facing.x : 0;
  const y = Number.isFinite(facing?.y) ? facing.y : 1;
  if (Math.hypot(x, y) < 0.0001) return 0;
  return (Math.round((Math.atan2(y, x) - Math.PI / 2) / (Math.PI / 4)) + 8) % 8;
}
// Travel, rather than wall-clock time, drives gait: a blocked actor cannot walk in place.
export function walkStep(travelled, stride = 96, phase = 0) {
  const cycle = ((travelled / stride + phase) % 1 + 1) % 1;
  return Math.floor(cycle * ANIMATION_FRAMES) % ANIMATION_FRAMES;
}
export function strikeFrame(progress) {
  return Math.min(ANIMATION_FRAMES - 1, Math.max(0, Math.floor(progress * ANIMATION_FRAMES)));
}
// Half the frames anticipate the existing impact; the other half finish and recover.
// Folhas de golpe com 4 quadros (preparacao, soco, impacto, recuperacao).
export function strikeColumn(progress) {
  return progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.8 ? 2 : 3;
}
export const PLAYER_STRIKE_DURATION = 0.36;
export const PLAYER_STRIKE_START = 0.375;
export function playerStrikeProgress(age) {
  if (age < 0 || age >= PLAYER_STRIKE_DURATION) return null;
  return PLAYER_STRIKE_START + (1 - PLAYER_STRIKE_START) * age / PLAYER_STRIKE_DURATION;
}
export function mobStrikeProgress(strike, time) {
  if (!strike || time < strike.started || time >= strike.until) return null;
  if (time < strike.release) return 0.5 * (time - strike.started) / (strike.release - strike.started);
  return 0.5 + 0.5 * (time - strike.release) / (strike.until - strike.release);
}
export function advancePose(previous, entity, dt, local = false) {
  const teleport = !previous || Math.hypot(previous.x - entity.x, previous.y - entity.y) > 250;
  const pose = teleport ? { x: entity.x, y: entity.y, facing: entity.facing || { x: 0, y: 1 }, travelled: 0 } : previous;
  const factor = Math.min(1, Math.max(0, dt) * (local ? 23 : 13));
  const dx = (entity.x - pose.x) * factor, dy = (entity.y - pose.y) * factor;
  pose.x += dx; pose.y += dy;
  if (entity.moving) pose.travelled += Math.hypot(dx, dy);
  if (entity.facing) pose.facing = entity.facing;
  else if (entity.moving && Math.hypot(dx, dy) > 0.05) pose.facing = { x: dx, y: dy };
  return pose;
}
