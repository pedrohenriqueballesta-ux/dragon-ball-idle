import { CONFIG, ZONES, OBSTACLES, MERCHANT, PLANETS, zoneAt } from '../shared/index.mjs';
import { art, CLEARINGS, drawTerrain, drawTree, drawRock, drawVendor, drawAlien, drawSaibaman, drawGoku, drawFreeza } from '../art/index.mjs';
import { clampZoom, zoomFromWheel, cameraView, worldFromPointer, advancePose, mobStrikeProgress } from '../render/camera.mjs';

const $ = id => document.getElementById(id);
const canvas = $('world'), ctx = canvas.getContext('2d'), mini = $('minimap'), mctx = mini.getContext('2d');
const keys = new Set(), renderPositions = new Map(), seenEvents = new Set();
let snapshot = null, session = '', playerId = '', eventSource = null, receivedAt = 0, width = 900, height = 600, ratio = 1;
let camera = { x: 0, y: 0, scale: 1 }, zoom = 1, pointerAim = null, touchVector = { x: 0, y: 0 }, lastUI = 0, sendingInput = false;
let floating = [], lastFrame = performance.now(), connectionError = false;
const integer = v => Math.round(v).toLocaleString('pt-BR');
const clock = seconds => { const n = Math.max(0, Math.ceil(seconds)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
const itemNames = { food: 'Presunto', ki: 'Poção de Ki', seed15: 'Semente 15%', seed30: 'Semente 30%', seed50: 'Semente 50%', seed100: 'Semente 100%' };

function renderSkillMeta(element, cost, detail) {
  if (!element) return;
  if (cost == null) { element.textContent = detail; return; }
  const costBadge = document.createElement('span'); costBadge.className = 'skill-cost'; costBadge.setAttribute('aria-label', cost + ' Ki');
  const costValue = document.createElement('b'); costValue.className = 'skill-cost-value'; costValue.textContent = cost;
  const costUnit = document.createElement('span'); costUnit.className = 'skill-cost-unit'; costUnit.textContent = 'KI';
  costBadge.replaceChildren(costValue, costUnit);
  const detailLabel = document.createElement('span');
  const isCooldown = /^(?:\d+(?:[.,]\d+)?s|\d+:\d{2})$/.test(detail);
  detailLabel.className = isCooldown ? 'skill-cost-detail skill-cooldown' : 'skill-cost-detail';
  detailLabel.textContent = detail;
  element.replaceChildren(costBadge, detailLabel);
}

function notify(text) {
  if ($('shopDialog').open) $('shopNotice').textContent = text;
  const element = document.createElement('div'); element.className = 'toast'; element.textContent = text;
  $('notifications').append(element); setTimeout(() => element.remove(), 4200);
  while ($('notifications').children.length > 3) $('notifications').firstChild.remove();
}
async function api(path, data = {}) {
  const res = await fetch('/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(res.status === 401 ? 'Sessão desconectada. Recarregue a página.' : 'Não foi possível executar a ação.');
  return res.json();
}
function action(data) {
  if (!session || !snapshot) return;
  api('action', data).catch(e => notify(e.message));
}
function connected(ok) {
  connectionError = !ok; $('connection').textContent = ok ? 'Servidor conectado' : 'Reconectando…';
  $('connection').classList.toggle('offline', !ok);
}
async function join(name, previousToken) {
  const res = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, token: previousToken }) });
  if (!res.ok) throw new Error('Não foi possível entrar. Confirme se o servidor está rodando.');
  const data = await res.json(); session = data.token; playerId = data.playerId;
  sessionStorage.setItem('dbi-session', session); localStorage.setItem('dbi-last-session', session); localStorage.setItem('dbi-name', name);
  if (eventSource) eventSource.close();
  eventSource = new EventSource('/api/events?session=' + encodeURIComponent(session));
  eventSource.onopen = () => connected(true);
  eventSource.onerror = () => connected(false);
  eventSource.onmessage = event => {
    try {
      snapshot = JSON.parse(event.data); receivedAt = performance.now();
      for (const effect of snapshot.events) {
        if (seenEvents.has(effect.id)) continue;
        seenEvents.add(effect.id);
        if (effect.type === 'message') notify(effect.text);
        else floating.push(effect);
      }
      if (seenEvents.size > 2000) { const items = [...seenEvents]; items.slice(0, 1000).forEach(id => seenEvents.delete(id)); }
      if (performance.now() - lastUI > 90) { updateUI(); lastUI = performance.now(); }
    } catch (e) { console.error('Falha ao ler estado do jogo:', e.message); }
  };
  if ($('welcomeDialog').open) $('welcomeDialog').close();
  notify(data.resumed ? 'Seu personagem foi recuperado.' : 'Bem-vindo! Vá aos Campos da Terra ou ative a caça automática.');
}

function updateUI() {
  const s = snapshot?.self, p = snapshot?.players.find(v => v.id === playerId); if (!s || !p) return;
  $('playerName').textContent = p.name; $('levelBadge').textContent = 'Lv. ' + s.level;
  $('hpBar').style.width = Math.max(0, 100 * s.hp / s.stats.hp) + '%';
  $('kiBar').style.width = Math.max(0, 100 * s.ki / s.stats.ki) + '%';
  $('hpText').textContent = integer(s.hp) + ' / ' + integer(s.stats.hp);
  $('kiText').textContent = integer(s.ki) + ' / ' + integer(s.stats.ki);
  const xpPct = Math.min(100, s.xp / Math.max(1, s.xpNext) * 100);
  $('xpLabel').textContent = 'Nível ' + s.level; $('xpNumbers').textContent = integer(s.xp) + ' / ' + integer(s.xpNext) + ' XP';
  $('xpBar').style.width = xpPct + '%';
  $('hudXpBar').style.width = xpPct + '%'; $('hudXpText').textContent = 'EXP · ' + Math.round(xpPct) + '%';
  $('formLabel').textContent = s.transformed ? 'SUPER SAIYAJIN' : 'FORMA BASE';
  $('nextUnlock').textContent = s.level < 2 ? 'Próximo: Kaioken + Barreira de Ki · NV. 2' : s.level < 3 ? 'Próximo: Kamehameha · NV. 3' : s.level < 5 ? 'Próximo: Super Saiyajin · NV. 5' : s.level < 10 ? 'Próximo: Genki Dama · NV. 10' : 'Todas as técnicas principais desbloqueadas.';
  const stats = [['Vida', integer(s.stats.hp)], ['Ki', integer(s.stats.ki)], ['Ataque', s.stats.attack.toFixed(1)], ['Defesa', s.stats.defense.toFixed(1)], ['Cura / comida', s.stats.healing.toFixed(2) + '×'], ['Mochila', s.stats.capacity.toFixed(1) + ' kg'], ['Chance loot', Math.round(s.stats.lootChance * 100) + '%'], ['Movimento', Math.round(s.stats.mobility)]];
  $('stats').replaceChildren(...stats.map(pair => { const div = document.createElement('div'); div.className = 'stat'; const label = document.createElement('span'), value = document.createElement('b'); label.textContent = pair[0]; value.textContent = pair[1]; div.append(label, value); return div; }));
  for (const key of ['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed']) $(key).checked = s[key];
  $('huntZone').value = s.huntZone; $('huntButton').classList.toggle('running', s.autoHunt);
  $('huntButton').textContent = s.autoHunt ? 'Pausar caça automática  ■' : 'Iniciar caça automática  ↗';
  $('foodCount').textContent = s.inventory.food; $('kiCount').textContent = s.inventory.ki;
  $('zeni').textContent = integer(s.zeni) + ' Z'; $('materials').textContent = s.inventory.scrap + ' sucatas · ' + s.inventory.crystal + ' cristais';
  $('bagLabel').textContent = s.weight.toFixed(1) + ' / ' + s.stats.capacity.toFixed(1) + ' KG';
  $('seedSelect').value = String(s.seedSelected);
  for (const option of $('seedSelect').options) option.textContent = option.value + '% · ' + (s.inventory['seed' + option.value] || 0);
  $('seedButton').disabled = s.seedRemaining > 0 || !s.inventory['seed' + s.seedSelected];
  $('seedButton').textContent = s.seedRemaining > 0 ? Math.ceil(s.seedRemaining) + 's' : 'Usar · R';
  $('seedStatus').textContent = s.seedRemaining > 0 ? 'Todas as sementes em recarga · ' + Math.ceil(s.seedRemaining) + 's' : 'Cura instantânea · recarga compartilhada de 20s';
  $('seedStatus').classList.toggle('waiting', s.seedRemaining > 0);
  $('kiPotionText').textContent = s.kiRemaining > 0 ? 'Recarga: ' + Math.ceil(s.kiRemaining) + 's' : 'Recupera 45% · Q';
  $('foodBuff').textContent = s.foodRemaining > 0 ? '🍖 ' + (CONFIG.foodHealPerSecond * s.stats.healing).toFixed(1) + ' vida/s · ' + clock(s.foodRemaining) : 'Comida inativa · F para comer';
  $('foodBuff').classList.toggle('inactive', s.foodRemaining <= 0);
  $('huntStatus').textContent = s.autoHunt ? 'CAÇA AUTOMÁTICA ATIVA' : 'Exploração manual';
  $('quickHunt').textContent = s.autoHunt ? '❚❚ Pausar caça · H' : '▶ Caça · H'; $('quickHunt').classList.toggle('running', s.autoHunt);
  const z = zoneAt(p.x, p.y);
  $('regionName').textContent = snapshot.planet !== 'namek' ? (PLANETS[snapshot.planet]?.name || 'Terra') : (z?.name || 'Trilhas da Terra');
  $('regionType').textContent = snapshot.planet !== 'namek' ? 'PLANETA SEGURO' : (z?.pvp ? 'COMBATE PVP HABILITADO' : 'REGIÃO PVE');
  document.querySelector('.region').classList.toggle('pvp', Boolean(z?.pvp));
  $('onlineText').textContent = snapshot.players.length + (snapshot.players.length === 1 ? ' jogador conectado' : ' jogadores conectados');
  $('coordsText').textContent = 'X: ' + Math.round(p.x) + '   Y: ' + Math.round(p.y);
  $('missionKills').textContent = Math.min(10, s.kills || 0);
  $('missionMaterials').textContent = (s.inventory.scrap || 0) + (s.inventory.crystal || 0);
  $('missionLevel').textContent = s.level;
  const target = snapshot.mobs.find(m => m.id === s.targetId) || snapshot.players.find(v => v.id === s.targetId);
  $('targetHud').classList.toggle('hidden', !target || target.hp <= 0);
  if (target) { $('targetName').textContent = target.name + ' · ' + integer(target.hp) + ' PV'; $('targetBar').style.width = 100 * target.hp / target.maxHp + '%'; }
  const skillState = {
    kame: { required: CONFIG.skills.kame, cost: CONFIG.skillCosts.kame, cooldown: CONFIG.skillCooldowns.kame, remaining: s.kameRemaining || 0, text: s.level < CONFIG.skills.kame ? CONFIG.skillCooldowns.kame + 's' : s.kameRemaining > 0 ? s.kameRemaining.toFixed(1) + 's' : CONFIG.skillCooldowns.kame + 's' },
    kaioken: { required: CONFIG.skills.kaioken, cost: CONFIG.skillCosts.kaioken, cooldown: CONFIG.skillCooldowns.kaioken, remaining: s.kaiokenRemaining || 0, text: s.level < CONFIG.skills.kaioken ? CONFIG.skillCooldowns.kaioken + 's' : s.kaiokenActive ? 'ATIVO' : s.kaiokenRemaining > 0 ? s.kaiokenRemaining.toFixed(1) + 's' : CONFIG.skillCooldowns.kaioken + 's', active: s.kaiokenActive },
    barrier: { required: CONFIG.skills.barrier, cost: CONFIG.skillCosts.barrier, cooldown: CONFIG.skillCooldowns.barrier, remaining: s.barrierRemaining || 0, text: s.level < CONFIG.skills.barrier ? CONFIG.skillCooldowns.barrier + 's' : s.barrierActive ? 'PROTEGIDO' : s.barrierRemaining > 0 ? s.barrierRemaining.toFixed(1) + 's' : CONFIG.skillCooldowns.barrier + 's', active: s.barrierActive },
    genki: { required: CONFIG.skills.genki, cost: CONFIG.skillCosts.genki, cooldown: CONFIG.skillCooldowns.genki, remaining: s.genkiRemaining || 0, text: s.level < CONFIG.skills.genki ? CONFIG.skillCooldowns.genki + 's' : s.genkiRemaining > 0 ? s.genkiRemaining.toFixed(1) + 's' : CONFIG.skillCooldowns.genki + 's' }
  };
  for (const button of document.querySelectorAll('[data-skill]')) {
    const skill = button.dataset.skill, state = skillState[skill]; if (!state) continue;
    const locked = s.level < state.required;
    button.classList.toggle('locked', locked); button.disabled = locked || state.remaining > 0 || (skill === 'kaioken' && s.kaiokenActive) || (skill === 'barrier' && s.barrierActive);
    button.classList.toggle('active', Boolean(state.active));
    const label = button.querySelector('small');
    renderSkillMeta(label, state.cost, state.text);
    let cooldown = button.querySelector('.cooldown-overlay');
    if (!cooldown) { cooldown = document.createElement('span'); cooldown.className = 'cooldown-overlay'; cooldown.setAttribute('aria-hidden', 'true'); button.append(cooldown); }
    const remaining = state.remaining;
    cooldown.textContent = remaining > 0 ? (remaining >= 10 ? Math.ceil(remaining) : remaining.toFixed(1)) + 's' : '';
    button.classList.toggle('cooling', remaining > 0);
    button.title = button.querySelector('strong').textContent + ' · ' + state.text + ' · tecla ' + button.querySelector('kbd').textContent;
  }
  const transformLocked = s.level < CONFIG.skills.transform;
  $('transformButton').disabled = transformLocked || (!s.transformed && (s.transformRemaining || 0) > 0);
  $('transformButton').classList.toggle('locked', transformLocked); $('transformButton').classList.toggle('active', s.transformed);
  $('transformButton').classList.toggle('cooling', !s.transformed && s.transformRemaining > 0);
  let transformCooldown = $('transformButton').querySelector('.cooldown-overlay');
  if (!transformCooldown) { transformCooldown = document.createElement('span'); transformCooldown.className = 'cooldown-overlay'; transformCooldown.setAttribute('aria-hidden', 'true'); $('transformButton').append(transformCooldown); }
  transformCooldown.textContent = !s.transformed && s.transformRemaining > 0 ? s.transformRemaining.toFixed(1) + 's' : '';
  renderSkillMeta(document.getElementById('transformText'), CONFIG.skillCosts.transform, transformLocked ? CONFIG.skillCooldowns.transform + 's' : s.transformed ? 'ATIVO · 3,5 Ki/s' : s.transformRemaining > 0 ? Math.ceil(s.transformRemaining) + 's' : CONFIG.skillCooldowns.transform + 's');
  $('respawn').classList.toggle('hidden', s.hp > 0);
  $('respawnText').textContent = 'Retornando à vila em ' + Math.ceil(s.respawnRemaining) + 's';
}

function inputVector() {
  let x = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + touchVector.x;
  let y = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0) + touchVector.y;
  const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
  return { x, y, ...(pointerAim ? { aimX: pointerAim.x, aimY: pointerAim.y } : {}) };
}
async function sendInput() {
  if (!session || !snapshot || sendingInput || connectionError) return;
  sendingInput = true;
  try { await api('input', inputVector()); } catch {} finally { sendingInput = false; }
}
setInterval(sendInput, 70);
document.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || document.querySelector('dialog[open]')) return;
  const key = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(key)) e.preventDefault();
  keys.add(key); sendInput(); if (e.repeat) return;
  const skills = { '1': 'kame', '2': 'kaioken', '3': 'barrier', '5': 'genki', ' ': 'basic', 'shift': 'dash' };
  if (skills[key]) action({ type: 'skill', skill: skills[key] });
  else if (key === '4' || key === 't') action({ type: 'transform' });
  else if (key === 'f') action({ type: 'food' });
  else if (key === 'q') action({ type: 'potion' });
  else if (key === 'r') action({ type: 'seed' });
  else if (key === 'h') $('huntButton').click();
});
document.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); sendInput(); });
window.addEventListener('blur', () => { keys.clear(); touchVector = { x: 0, y: 0 }; sendInput(); });
window.addEventListener('pagehide', () => {
  if (session) fetch('/api/save', { method: 'POST', headers: { Authorization: 'Bearer ' + session }, keepalive: true }).catch(() => {});
});
function setZoom(value) {
  zoom = clampZoom(value);
  $('zoomLabel').textContent = Math.round(zoom * 100) + '%';
  $('zoomOut').disabled = zoom <= 0.65;
  $('zoomIn').disabled = zoom >= 2;
  // Do not keep an aim point derived from the old camera scale.
  pointerAim = null;
}
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  setZoom(zoomFromWheel(zoom, event.deltaY, event.deltaMode));
}, { passive: false });
$('zoomOut').onclick = () => setZoom(zoom / 1.2);
$('zoomIn').onclick = () => setZoom(zoom * 1.2);
const toWorld = event => worldFromPointer(event.clientX, event.clientY, canvas.getBoundingClientRect(), camera);
canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') pointerAim = toWorld(e); });
canvas.addEventListener('pointerdown', e => {
  if (!snapshot) return; canvas.focus(); const point = toWorld(e);
  const targets = [...snapshot.mobs, ...snapshot.players.filter(p => p.id !== playerId)];
  const target = targets.find(t => Math.hypot(t.x - point.x, t.y - point.y) < (t.type === 'boss' ? 45 : 30));
  if (target) action({ type: 'target', id: target.id }); else action({ type: 'moveTo', x: point.x, y: point.y });
});
for (const button of document.querySelectorAll('[data-skill]')) button.addEventListener('click', () => action({ type: 'skill', skill: button.dataset.skill }));
for (const key of ['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed']) $(key).addEventListener('change', () => action({ type: 'toggle', key, value: $(key).checked }));
$('huntButton').addEventListener('click', () => action({ type: 'hunt', zone: $('huntZone').value, enabled: !snapshot?.self?.autoHunt }));
$('huntZone').addEventListener('change', () => action({ type: 'hunt', zone: $('huntZone').value, enabled: Boolean(snapshot?.self?.autoHunt) }));
$('foodButton').onclick = () => action({ type: 'food' });
$('kiPotionButton').onclick = () => action({ type: 'potion' });
$('seedButton').onclick = () => action({ type: 'seed', potency: Number($('seedSelect').value) });
$('seedSelect').onchange = () => action({ type: 'selectSeed', potency: Number($('seedSelect').value) });
$('transformButton').onclick = () => action({ type: 'transform' });
$('helpButton').onclick = () => { keys.clear(); sendInput(); $('helpDialog').showModal(); };
$('panelButton').onclick = () => { const open = $('panel').classList.toggle('open'); $('panelButton').setAttribute('aria-expanded', String(open)); };
$('quickHunt').onclick = () => $('huntButton').click();
$('shopButton').onclick = () => $('shopDialog').showModal();
for (const btn of document.querySelectorAll('[data-close]')) btn.onclick = () => $(btn.dataset.close).close();
for (const btn of document.querySelectorAll('[data-travel]')) btn.onclick = () => action({ type: 'travel', zone: btn.dataset.travel });
for (const btn of document.querySelectorAll('[data-planet]')) btn.onclick = () => { action({ type: 'travelPlanet', planet: btn.dataset.planet }); $('planetsDialog')?.close(); };
$('saveButton').onclick = async () => { try { await api('save'); notify('Progresso salvo no servidor.'); } catch (e) { notify(e.message); } };
for (const [key, price] of Object.entries(CONFIG.prices)) {
  const row = document.createElement('div'); row.className = 'shop-item';
  const label = document.createElement('span'); label.textContent = itemNames[key];
  const btn = document.createElement('button'); btn.textContent = price + ' Z · comprar'; btn.onclick = () => action({ type: 'buy', item: key });
  row.append(label, btn); $('shopItems').append(row);
}
$('sellButton').onclick = () => action({ type: 'sell' });
$('joinForm').onsubmit = async event => { event.preventDefault(); const button = event.target.querySelector('button'); button.disabled = true; try { await join($('nickname').value); } catch (e) { notify(e.message); } finally { button.disabled = false; } };

let joystickPointer = null;
const joystick = $('joystick'), knob = $('joystickKnob');
function joystickMove(e) {
  const r = joystick.getBoundingClientRect(), dx = e.clientX - r.left - 50, dy = e.clientY - r.top - 50, d = Math.max(35, Math.hypot(dx, dy));
  touchVector = { x: dx / d, y: dy / d }; knob.style.transform = 'translate(' + touchVector.x * 28 + 'px,' + touchVector.y * 28 + 'px)';
  pointerAim = null; sendInput();
}
joystick.onpointerdown = e => { e.preventDefault(); joystickPointer = e.pointerId; joystick.setPointerCapture(e.pointerId); joystickMove(e); };
joystick.onpointermove = e => { if (e.pointerId === joystickPointer) joystickMove(e); };
const releaseJoystick = () => { joystickPointer = null; touchVector = { x: 0, y: 0 }; knob.style.transform = ''; sendInput(); };
joystick.onpointerup = releaseJoystick; joystick.onpointercancel = releaseJoystick;

// Sprites simples de reserva, usados enquanto as artes carregam.
function sprite(draw, w = 24, h = 32) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); return c; }
const gokuSprite = (gold = false, back = false) => sprite(c => {
  c.fillStyle = '#20232b'; c.fillRect(6, 19, 14, 9);
  c.fillStyle = '#ed8437'; c.fillRect(7, 15, 12, 10); c.fillRect(7, 24, 5, 6); c.fillRect(14, 24, 5, 6);
  c.fillStyle = '#154e7c'; c.fillRect(7, 22, 12, 3); c.fillRect(7, 29, 5, 3); c.fillRect(14, 29, 5, 3); c.fillRect(5, 17, 3, 5); c.fillRect(19, 17, 3, 5);
  c.fillStyle = '#e9ae78'; c.fillRect(4, 15, 3, 6); c.fillRect(20, 15, 3, 6); c.fillRect(9, 7, 9, 8);
  c.fillStyle = gold ? '#f1da66' : '#141d26'; c.beginPath(); c.moveTo(5, 9); c.lineTo(1, 4); c.lineTo(9, 5); c.lineTo(8, 0); c.lineTo(13, 4); c.lineTo(17, 0); c.lineTo(18, 5); c.lineTo(23, 3); c.lineTo(20, 10); c.lineTo(17, 12); c.lineTo(15, 7); c.lineTo(12, 11); c.lineTo(10, 8); c.lineTo(7, 11); c.closePath(); c.fill();
  if (!back) { c.fillStyle = '#fff3d0'; c.fillRect(10, 11, 2, 1); c.fillRect(15, 11, 2, 1); c.fillStyle = '#24313c'; c.fillRect(11, 11, 1, 1); c.fillRect(15, 11, 1, 1); c.fillStyle = '#bd7449'; c.fillRect(12, 14, 3, 1); }
  else { c.fillStyle = '#f4e4b4'; c.fillRect(10, 17, 7, 5); c.fillStyle = '#374337'; c.fillRect(12, 18, 3, 3); }
});
const sprites = { goku: gokuSprite(), gokuBack: gokuSprite(false, true), ssj: gokuSprite(true), ssjBack: gokuSprite(true, true),
  melee: sprite(c => { c.fillStyle = '#376a43'; c.fillRect(7, 16, 12, 11); c.fillRect(5, 25, 5, 5); c.fillRect(16, 25, 5, 5); c.fillStyle = '#78a65c'; c.fillRect(6, 5, 14, 14); c.fillRect(2, 8, 4, 5); c.fillRect(20, 8, 4, 5); c.fillRect(3, 18, 4, 8); c.fillRect(20, 18, 4, 8); c.fillStyle = '#9cc878'; c.fillRect(9, 4, 8, 5); c.fillStyle = '#e8c7b0'; c.fillRect(8, 11, 4, 3); c.fillRect(15, 11, 4, 3); c.fillStyle = '#8d333b'; c.fillRect(10, 12, 2, 1); c.fillRect(15, 12, 2, 1); }),
  ranged: sprite(c => { c.fillStyle = '#40374e'; c.fillRect(7, 17, 13, 11); c.fillRect(6, 26, 5, 5); c.fillRect(16, 26, 5, 5); c.fillStyle = '#ac9bbb'; c.fillRect(7, 4, 12, 13); c.fillRect(3, 18, 4, 8); c.fillRect(20, 18, 4, 8); c.fillStyle = '#6d456a'; c.fillRect(9, 2, 8, 6); c.fillRect(8, 17, 10, 5); c.fillStyle = '#e8d5c5'; c.fillRect(9, 10, 8, 3); c.fillStyle = '#ba5c65'; c.fillRect(11, 10, 2, 2); c.fillRect(15, 10, 2, 2); }),
  tree: sprite(c => { c.fillStyle = '#5a4936'; c.fillRect(13, 15, 5, 17); c.fillStyle = '#173f35'; c.fillRect(5, 12, 25, 10); c.fillRect(2, 7, 27, 10); c.fillStyle = '#2b6349'; c.fillRect(5, 3, 23, 12); c.fillRect(2, 6, 28, 8); c.fillStyle = '#3d7853'; c.fillRect(9, 0, 15, 8); c.fillRect(5, 4, 8, 4); c.fillStyle = '#638758'; c.fillRect(10, 2, 5, 3); }, 32, 34),
  rock: sprite(c => { c.fillStyle = '#3c4140'; c.fillRect(2, 9, 27, 13); c.fillStyle = '#747971'; c.beginPath(); c.moveTo(0, 13); c.lineTo(7, 4); c.lineTo(23, 2); c.lineTo(32, 12); c.lineTo(27, 24); c.lineTo(7, 24); c.closePath(); c.fill(); c.fillStyle = '#96998a'; c.fillRect(7, 7, 13, 3); c.fillRect(5, 11, 4, 3); c.fillStyle = '#555f56'; c.fillRect(18, 16, 11, 6); }, 32, 26)
};
function resize() {
  const r = canvas.getBoundingClientRect(); width = r.width; height = r.height; ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); ctx.imageSmoothingEnabled = false;
}
new ResizeObserver(resize).observe(canvas);
function screenPosition(entity, dt) {
  const p = advancePose(renderPositions.get(entity.id), entity, dt, entity.id === playerId);
  renderPositions.set(entity.id, p); return p;
}
function shadow(x, y, size = 16) { ctx.fillStyle = '#15291e66'; ctx.beginPath(); ctx.ellipse(x, y + 4, size, size * 0.35, 0, 0, Math.PI * 2); ctx.fill(); }
function healthBar(x, y, hp, max, color, size = 40) { ctx.fillStyle = '#0c1b1c'; ctx.fillRect(x - size / 2 - 1, y - 1, size + 2, 6); ctx.fillStyle = color; ctx.fillRect(x - size / 2, y, Math.max(0, size * hp / max), 4); }
function drawPlayer(p, pos, time) {
  shadow(pos.x, pos.y, 20);
  const back = p.facing.y < -0.3;
  const image = p.transformed ? (back ? sprites.ssjBack : sprites.ssj) : back ? sprites.gokuBack : sprites.goku;
  const bob = p.moving ? Math.sin(time * 15) * 1.4 : 0;
  if (p.transformed) { ctx.strokeStyle = '#f1d75a88'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pos.x, pos.y - 20, 28 + Math.sin(time * 10) * 3, 42, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (p.id === playerId && snapshot.self?.kaiokenActive) { ctx.strokeStyle = '#ff4c43aa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(pos.x, pos.y - 20, 31 + Math.sin(time * 18) * 3, 44, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (p.id === playerId && snapshot.self?.barrierActive) { const r = 33 + Math.sin(time * 12) * 2; ctx.strokeStyle = '#66dfffcc'; ctx.lineWidth = 2.5; ctx.fillStyle = '#4bc5ff18'; ctx.beginPath(); ctx.arc(pos.x, pos.y - 22, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  const strike = floating.find(e => e.playerId === p.id && e.type === 'punch' && time - e.at >= 0 && time - e.at < 0.36);
  const strikeProgress = strike ? Math.min(1, (time - strike.at) / 0.36) : null;
  const hit = floating.some(e => e.targetId === p.id && e.type === 'damage' && time - e.at >= 0 && time - e.at < 0.12);
  if (p.dashing) { ctx.globalAlpha = 0.3; drawGoku(ctx, p, { ...pos, x: pos.x - p.facing.x * 23, y: pos.y - p.facing.y * 23 }, time, strikeProgress); ctx.globalAlpha = 1; }
  ctx.save(); if (hit) ctx.filter = 'brightness(1.7) saturate(.6)';
  if (!drawGoku(ctx, p, pos, time, strikeProgress)) ctx.drawImage(image, Math.round(pos.x - 21), Math.round(pos.y - 49 + bob), 42, 56);
  ctx.restore();
  if (p.charge) { ctx.fillStyle = '#bdefff'; ctx.beginPath(); ctx.arc(pos.x + p.facing.x * 26, pos.y - 16 + p.facing.y * 18, 7 + Math.sin(time * 22) * 2, 0, Math.PI * 2); ctx.fill(); }
  if (p.id !== playerId) { healthBar(pos.x, pos.y - 61, p.hp, p.maxHp, '#72a6c4', 42); ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ecf3dd'; ctx.fillText(p.name, pos.x, pos.y - 67); }
  else { ctx.fillStyle = '#f9d3a4'; ctx.beginPath(); ctx.moveTo(pos.x - 4, pos.y + 13); ctx.lineTo(pos.x + 4, pos.y + 13); ctx.lineTo(pos.x, pos.y + 18); ctx.fill(); }
}
function drawMob(m, pos, time) {
  const boss = m.type === 'boss', size = boss ? 76 : 40, h = boss ? 100 : 53;
  shadow(pos.x, pos.y, boss ? 35 : 17);
  if (snapshot.self?.targetId === m.id) { ctx.strokeStyle = '#f3c47b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pos.x, pos.y + 3, boss ? 39 : 24, boss ? 17 : 11, 0, 0, Math.PI * 2); ctx.stroke(); }
  const hit = floating.some(e => e.targetId === m.id && e.type === 'damage' && time - e.at >= 0 && time - e.at < 0.12);
  const phase = ((Number(m.id.replace(/\D/g, '')) || 0) % 16) / 16;
  const attackProgress = mobStrikeProgress(m.strike, time);
  const facing = attackProgress !== null ? m.strike.direction : pos.facing;
  ctx.save(); if (hit) ctx.filter = 'brightness(1.7) saturate(.6)';
  const drawn = boss
    ? drawFreeza(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled)
    : m.type === 'melee'
      ? drawSaibaman(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled)
      : drawAlien(ctx, pos.x, pos.y, size + 8, h + 5, time, m.moving, facing, phase, attackProgress, pos.travelled);
  if (!drawn) ctx.drawImage(boss ? art.freezaBoss : m.type === 'melee' ? sprites.melee : sprites.ranged, Math.round(pos.x - size / 2), Math.round(pos.y - h + 8 + (m.moving ? Math.sin(time * 14) : 0)), size, h);
  ctx.restore();
  if (m.hp < m.maxHp || snapshot.self?.targetId === m.id || boss) healthBar(pos.x, pos.y - h - 2, m.hp, m.maxHp, boss ? '#d38c62' : '#c29d6d', boss ? 72 : 40);
  if (boss || snapshot.self?.targetId === m.id) { ctx.font = boss ? 'bold 12px monospace' : '9px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#f0d5b2'; ctx.fillText(m.name, pos.x, pos.y - h - 9); }
}
function telegraphs(time) {
  for (const m of snapshot.mobs) {
    const t = m.telegraph; if (!t) continue;
    const progress = Math.min(1, Math.max(0, (time - t.started) / (t.until - t.started)));
    if (t.kind === 'shot') { ctx.strokeStyle = '#f5a37ca0'; ctx.lineWidth = 7; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + t.dx * 240, t.y + t.dy * 240); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.fillStyle = '#a9423340'; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d6745460'; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f3b089'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function effects(time) {
  floating = floating.filter(e => time - e.at < 1.5);
  for (const e of floating) {
    const age = time - e.at; if (age < 0) continue;
    if (e.type === 'beam' && age < 0.35) {
      ctx.globalAlpha = Math.max(0, 1 - age / 0.35); ctx.lineCap = 'round'; ctx.strokeStyle = '#4bb9e899'; ctx.lineWidth = 32; ctx.beginPath(); ctx.moveTo(e.x, e.y - 12); ctx.lineTo(e.bx, e.by - 12); ctx.stroke(); ctx.strokeStyle = '#d7fbff'; ctx.lineWidth = 11; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    } else if (e.type === 'punch' && age < 0.18) {
      ctx.strokeStyle = '#ffe4a7'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x + e.dx * 30, e.y - 10 + e.dy * 30, 17, -1.1, 1.1); ctx.stroke();
    } else if (['damage', 'heal', 'level'].includes(e.type)) {
      ctx.globalAlpha = Math.max(0, 1 - age / 1.5); ctx.font = e.type === 'level' ? 'bold 18px monospace' : 'bold 14px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = e.type === 'damage' ? '#ffe2b0' : e.type === 'level' ? '#f3d76d' : '#b7ec9d'; ctx.strokeStyle = '#182522'; ctx.lineWidth = 3;
      const text = e.type === 'damage' ? '-' + e.amount : e.type === 'level' ? 'NÍVEL ' + e.level : e.text;
      ctx.strokeText(text, e.x, e.y - 40 - age * 25); ctx.fillText(text, e.x, e.y - 40 - age * 25); ctx.globalAlpha = 1;
    }
  }
}
function drawMinimap(onNamek = true, world = PLANETS.namek) {
  const mapW = mini.width, mapH = mini.height;
  mctx.fillStyle = onNamek ? '#385a2d' : '#4f8a3a'; mctx.fillRect(0, 0, mapW, mapH);
  const sx = mapW / world.w, sy = mapH / world.h;
  if (onNamek) {
    mctx.fillStyle = '#c09b6e';
    mctx.beginPath();
    for (const [x,y,w,h,r] of CLEARINGS) mctx.roundRect(x*sx,y*sy,w*sx,h*sy,r*Math.min(sx,sy));
    mctx.fill();
    const arena=ZONES.find(z => z.pvp); mctx.fillStyle='#a44f3655'; mctx.fillRect(arena.x*sx,arena.y*sy,arena.w*sx,arena.h*sy);
    for (const o of OBSTACLES) { mctx.fillStyle = o.type === 'tree' ? '#92b342' : '#a8a49a'; mctx.beginPath(); mctx.arc(o.x*sx,o.y*sy,o.type === 'tree' ? 2.2 : 1.7,0,Math.PI*2); mctx.fill(); }
    for (const mob of snapshot.mobs) { mctx.fillStyle = mob.type === 'boss' ? '#ff9369' : '#d96049'; mctx.fillRect(mob.x*sx-1,mob.y*sy-1,2,2); }
  }
  for (const p of snapshot.players) { mctx.fillStyle = p.id === playerId ? '#fff5b4' : '#80d6ea'; mctx.beginPath();mctx.arc(p.x*sx,p.y*sy,2.5,0,Math.PI*2);mctx.fill(); }
  mctx.strokeStyle = '#fff0c488'; mctx.lineWidth = 1; mctx.strokeRect(camera.x * sx, camera.y * sy, width / camera.scale * sx, height / camera.scale * sy);
}
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height); ctx.imageSmoothingEnabled = false;
  if (!snapshot) {
    ctx.fillStyle = '#2f4a3b'; ctx.fillRect(0, 0, width, height); ctx.fillStyle = '#9db78f'; ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.fillText('PREPARANDO O MUNDO', width / 2, height / 2); requestAnimationFrame(frame); return;
  }
  const time = snapshot.time + Math.min(0.2, (now - receivedAt) / 1000);
  const onNamek = snapshot.planet === 'namek';
  const world = PLANETS[snapshot.planet] || PLANETS.namek;
  const self = snapshot.players.find(p => p.id === playerId);
  for (const entity of [...snapshot.players, ...snapshot.mobs]) screenPosition(entity, dt);
  const position = self ? renderPositions.get(self.id) : { x: world.w / 2, y: world.h / 2 };
  camera = cameraView(position, width, height, zoom, world.w, world.h);
  ctx.save(); ctx.scale(camera.scale, camera.scale); ctx.translate(-camera.x, -camera.y);
  if (onNamek) {
    drawTerrain(ctx, CONFIG, ZONES, MERCHANT, camera, width, height); telegraphs(time);
    for (const l of snapshot.loot) { shadow(l.x, l.y, 7); ctx.fillStyle = l.item.startsWith('seed') ? '#a4cf72' : l.item === 'crystal' ? '#83d2d3' : '#d7c8a3'; ctx.fillRect(l.x - 5, l.y - 6 + Math.sin(time * 3) * 2, 10, 9); ctx.fillStyle = '#edf3c1'; ctx.fillRect(l.x - 2, l.y - 8, 4, 3); }
  } else {
    // Planeta Terra: gramado verde limpo e seguro (tela inicial).
    ctx.fillStyle = '#5a8f3c'; ctx.fillRect(0, 0, world.w, world.h);
    ctx.strokeStyle = '#3c6428'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, world.w, world.h);
  }
  const drawables = [
    ...(onNamek ? OBSTACLES.map(o => ({ y: o.y, draw: () => { if (o.type === 'tree') { shadow(o.x, o.y, o.r); if (!drawTree(ctx, o)) ctx.drawImage(sprites.tree, o.x - 61, o.y - 116, 122, 130); } else if (!drawRock(ctx, o)) { shadow(o.x, o.y, o.r); ctx.drawImage(sprites.rock, o.x - o.r, o.y - o.r * 1.15, o.r * 2, o.r * 1.7); } } })) : []),
    ...(onNamek ? [{ y: MERCHANT.y, draw: () => drawVendor(ctx, MERCHANT) }] : []),
    ...snapshot.players.map(p => ({ y: renderPositions.get(p.id).y, draw: () => drawPlayer(p, renderPositions.get(p.id), time) })),
    ...snapshot.mobs.map(m => ({ y: renderPositions.get(m.id).y, draw: () => drawMob(m, renderPositions.get(m.id), time) }))
  ].sort((a, b) => a.y - b.y);
  for (const d of drawables) if (d.y > camera.y - 150 && d.y < camera.y + height / camera.scale + 150) d.draw();
  for (const s of snapshot.projectiles) {
    const px = s.x + s.dx * s.speed * Math.min(0.07, (now - receivedAt) / 1000), py = s.y + s.dy * s.speed * Math.min(0.07, (now - receivedAt) / 1000);
    if (s.kind === 'genki') { ctx.save(); const glow = ctx.createRadialGradient(px, py, 3, px, py, 29); glow.addColorStop(0, '#ffffff'); glow.addColorStop(.28, '#c4f7ff'); glow.addColorStop(.7, '#5cbbff'); glow.addColorStop(1, '#a152ff00'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, 29, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else { ctx.strokeStyle = s.ownerType === 'player' ? '#b7edff' : '#f3ba8d'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px - s.dx * 12, py - s.dy * 12); ctx.lineTo(px, py); ctx.stroke(); ctx.lineCap = 'butt'; }
  }
  effects(time); ctx.restore(); drawMinimap(onNamek, world); requestAnimationFrame(frame);
}
resize(); requestAnimationFrame(frame);
const previousToken = sessionStorage.getItem('dbi-session') || localStorage.getItem('dbi-last-session');
if (previousToken) join(localStorage.getItem('dbi-name') || 'Guerreiro', previousToken).catch(e => { notify(e.message); $('welcomeDialog').showModal(); });
else { $('nickname').value = localStorage.getItem('dbi-name') || 'Guerreiro'; $('welcomeDialog').showModal(); }
