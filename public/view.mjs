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
export function spriteFacing(facing) {
  const { x = 0, y = 1 } = facing || {};
  if (Math.abs(x) > Math.abs(y) * 1.15) return { column: 3, flip: x < 0 };
  return { column: y < 0 ? 1 : 0, flip: false };
}
export const walkStep = (time, phase = 0) => Math.floor(time * 7 + phase) % 2;
