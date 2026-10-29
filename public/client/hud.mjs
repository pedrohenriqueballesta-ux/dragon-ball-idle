// HUD: tudo o que o jogo mostra e liga na página (barras, botões, painéis, notificações, loja,
// janelas de mundo e de caçada). O resto do cliente (mapa, rede, teclado, joystick) fica em game.mjs.
// A HUD está em troca (ramo hud-nova): qualquer elemento pode sumir da página sem derrubar o jogo.
// `$` devolve um elemento vazio que aceita tudo e não faz nada, e avisa no console uma vez por id.
import { CONFIG, PLANETS, zoneAt } from '../shared/index.mjs';

const avisados = new Set();
const VAZIO = new Proxy(function () {}, {
  get: (_, chave) => chave === Symbol.toPrimitive ? () => '' : chave === Symbol.iterator ? [][Symbol.iterator].bind([]) : ['options', 'children'].includes(chave) ? [] : VAZIO,
  set: () => true,
  apply: () => VAZIO
});
export const $ = id => {
  const elemento = document.getElementById(id);
  if (elemento) return elemento;
  if (!avisados.has(id)) { avisados.add(id); console.warn('HUD: elemento #' + id + ' não existe na página (ignorado).'); }
  return VAZIO;
};

// Ligação com o jogo: ação no servidor, chamada à API, estado atual e soltar as teclas.
let ctx = null;
const action = data => ctx?.action(data);

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

export function notify(text) {
  if ($('shopDialog').open) $('shopNotice').textContent = text;
  const element = document.createElement('div'); element.className = 'toast'; element.textContent = text;
  $('notifications').append(element); setTimeout(() => element.remove(), 4200);
  while ($('notifications').children.length > 3) $('notifications').firstChild.remove();
}

export function atualizarHud(snapshot, playerId) {
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
  $('regionName').textContent = snapshot.planet !== 'namek' ? (PLANETS[snapshot.planet]?.name || 'Terra') : (z?.name || 'Trilhas de Namekusei');
  $('regionType').textContent = snapshot.planet !== 'namek' ? 'PLANETA SEGURO' : (z?.pvp ? 'COMBATE PVP HABILITADO' : 'REGIÃO PVE');
  document.querySelector('.region')?.classList.toggle('pvp', Boolean(z?.pvp));
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
    button.title = (button.querySelector('strong')?.textContent || skill) + ' · ' + state.text + (button.querySelector('kbd') ? ' · tecla ' + button.querySelector('kbd').textContent : '');
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
  if (document.getElementById('planetsDialog')?.open) markCurrentWorld(snapshot);
}

function markCurrentWorld(snapshot) {
  const here = snapshot?.planet;
  for (const card of document.querySelectorAll('#planetsDialog .world-card[data-planet]')) {
    const isHere = card.dataset.planet === here;
    card.classList.toggle('current', isHere);
    const st = card.querySelector('.world-status');
    if (st) st.textContent = isHere ? 'Você está aqui' : 'Viajar';
  }
}
const HUNT_STAGES = {
  namek: { name: 'Namekusei', bg: 'namek', stages: [
    { name: 'Saibaman', x: 18.5, y: 22.3, lv: [1, 6], sprite: 'saibaman' },
    { name: 'Mestre Kame', x: 39.3, y: 20.7, lv: [7, 13], sprite: 'mestre-kame' },
    { name: 'Princesa Serpente', x: 60.7, y: 59, lv: [14, 20], sprite: 'princesa-snake' },
    { name: 'Toma', x: 87.8, y: 73, lv: [21, 26], sprite: 'toma' },
    { name: 'Fasha', x: 41.9, y: 59.8, lv: [27, 33], sprite: 'fasha' },
    { name: 'Bardock', x: 38.8, y: 40.2, lv: [34, 40], sprite: 'bardock-fases-bardock' },
    { name: 'Raditz', x: 58.6, y: 21.5, lv: [41, 46], sprite: 'raditz-fases-raditz' },
    { name: 'Nappa (Armadura)', x: 81.5, y: 40.2, lv: [47, 53], sprite: 'nappa-armadura' },
    { name: 'Turles', x: 60.7, y: 40.2, lv: [54, 60], sprite: 'turles' },
    { name: 'Chaos', x: 17.4, y: 39.5, lv: [61, 66], sprite: 'chaos' },
    { name: 'Lord Slug', x: 80.5, y: 20.7, lv: [67, 73], sprite: 'lord-slug' },
    { name: 'Garlic Jr.', x: 82, y: 58.8, lv: [74, 80], sprite: 'garlic-jr' },
    { name: 'Vovo Gohan', x: 18, y: 58.8, lv: [81, 86], sprite: 'vogohan' }
  ] }
};
// Cidades da Terra: entrada livre, sem nível mínimo. Todas levam ao spawn seguro (Terra).
const CITIES = {
  cidades: { name: 'Cidades', bg: 'terra', list: [
    { name: 'Cidade do Oeste', x: 22, y: 28 },
    { name: 'Cidade do Norte', x: 50, y: 17 },
    { name: 'Cidade do Leste', x: 78, y: 29 },
    { name: 'Cidade Central', x: 49, y: 49 },
    { name: 'Vila Pinguim', x: 24, y: 70 },
    { name: 'Cidade Satã', x: 76, y: 68 },
    { name: 'Cidade do Sul', x: 50, y: 82 }
  ] }
};
function selectPlanet(planet) {
  document.getElementById('planetsDialog')?.close();
  if (CITIES[planet]) openCities(planet);
  else if (HUNT_STAGES[planet]) openHunt(planet);
  else action({ type: 'travelPlanet', planet });
}
function openHunt(planet) {
  const data = HUNT_STAGES[planet]; if (!data) return;
  $('huntTitle').textContent = data.name;
  $('huntSub').textContent = 'Nível de Conta';
  $('huntFoot').textContent = 'Escolha uma caçada no mapa';
  $('huntMap').style.backgroundImage = 'url(/assets/worlds/' + data.bg + '.webp)';
  renderHuntPins(planet);
  $('huntDialog').showModal();
}
function openCities(key) {
  const data = CITIES[key]; if (!data) return;
  $('huntTitle').textContent = data.name;
  $('huntSub').textContent = 'Terra · entrada livre';
  $('huntFoot').textContent = 'Escolha uma cidade';
  $('huntMap').style.backgroundImage = 'url(/assets/worlds/' + data.bg + '.webp)';
  renderCityPins(key);
  $('huntDialog').showModal();
}
function renderCityPins(key) {
  const data = CITIES[key], layer = $('huntPins'); if (!data || !layer) return;
  layer.replaceChildren(...data.list.map(c => {
    const pin = document.createElement('button');
    pin.className = 'hunt-pin city';
    pin.style.left = c.x + '%'; pin.style.top = c.y + '%';
    pin.onclick = () => { $('huntDialog').close(); action({ type: 'travelPlanet', planet: 'terra' }); notify('Viajando para ' + c.name); };
    const orb = document.createElement('span'); orb.className = 'hunt-orb'; orb.textContent = '\u{1F3D9}\u{FE0F}';
    const nm = document.createElement('strong'); nm.textContent = c.name;
    pin.append(orb, nm); return pin;
  }));
}
function renderHuntPins(planet) {
  const data = HUNT_STAGES[planet], layer = $('huntPins'); if (!data || !layer) return;
  const lvl = ctx?.snapshot()?.self?.level || 1;
  layer.replaceChildren(...data.stages.map(st => {
    const locked = lvl < st.lv[0];
    const pin = document.createElement(locked ? 'div' : 'button');
    pin.className = 'hunt-pin' + (locked ? ' locked' : '');
    pin.style.left = st.x + '%'; pin.style.top = st.y + '%';
    if (!locked) pin.onclick = () => { $('huntDialog').close(); action({ type: 'travelPlanet', planet: 'namek' }); notify('Cacada: ' + st.name); };
    const orb = document.createElement('span'); orb.className = 'hunt-orb';
    orb.style.backgroundImage = 'url(/assets/worlds/pins/' + st.sprite + '.webp)';
    const nm = document.createElement('strong'); nm.textContent = st.name;
    const lv = document.createElement('small'); lv.textContent = 'Nv ' + st.lv[0] + '-' + st.lv[1];
    pin.append(orb, nm, lv); return pin;
  }));
}

// Liga ou pausa a caça automática (botão de caça e tecla H). A região vem da lista da página,
// se existir; senão, da última que o servidor registrou para o jogador.
const regiaoDeCaca = () => document.getElementById('huntZone')?.value || ctx?.snapshot()?.self?.huntZone || 'campos';
export function alternarCaca() {
  action({ type: 'hunt', zone: regiaoDeCaca(), enabled: !ctx?.snapshot()?.self?.autoHunt });
}

// Liga os botões e janelas da HUD ao jogo. Chamado uma vez por game.mjs.
export function ligarHud(contexto) {
  ctx = contexto;
  for (const button of document.querySelectorAll('[data-skill]')) button.addEventListener('click', () => action({ type: 'skill', skill: button.dataset.skill }));
  for (const key of ['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed']) $(key).addEventListener('change', () => action({ type: 'toggle', key, value: $(key).checked }));
  $('huntButton').addEventListener('click', alternarCaca);
  $('huntZone').addEventListener('change', () => action({ type: 'hunt', zone: regiaoDeCaca(), enabled: Boolean(ctx.snapshot()?.self?.autoHunt) }));
  $('foodButton').onclick = () => action({ type: 'food' });
  $('kiPotionButton').onclick = () => action({ type: 'potion' });
  $('seedButton').onclick = () => action({ type: 'seed', potency: Number($('seedSelect').value) });
  $('seedSelect').onchange = () => action({ type: 'selectSeed', potency: Number($('seedSelect').value) });
  $('transformButton').onclick = () => action({ type: 'transform' });
  $('helpButton').onclick = () => { ctx.soltarTeclas(); $('helpDialog').showModal(); };
  $('panelButton').onclick = () => { const open = $('panel').classList.toggle('open'); $('panelButton').setAttribute('aria-expanded', String(open)); };
  $('quickHunt').onclick = alternarCaca;
  $('shopButton').onclick = () => $('shopDialog').showModal();
  for (const btn of document.querySelectorAll('[data-close]')) btn.onclick = () => $(btn.dataset.close).close();
  for (const btn of document.querySelectorAll('[data-travel]')) btn.onclick = () => action({ type: 'travel', zone: btn.dataset.travel });
  for (const btn of document.querySelectorAll('[data-planet]')) btn.onclick = () => selectPlanet(btn.dataset.planet);
  $('huntBack').onclick = () => { $('huntDialog').close(); $('planetsDialog').showModal(); };
  $('saveButton').onclick = async () => { try { await ctx.api('save'); notify('Progresso salvo no servidor.'); } catch (e) { notify(e.message); } };
  for (const [key, price] of Object.entries(CONFIG.prices)) {
    const row = document.createElement('div'); row.className = 'shop-item';
    const label = document.createElement('span'); label.textContent = itemNames[key];
    const btn = document.createElement('button'); btn.textContent = price + ' Z · comprar'; btn.onclick = () => action({ type: 'buy', item: key });
    row.append(label, btn); $('shopItems').append(row);
  }
  $('sellButton').onclick = () => action({ type: 'sell' });
}
