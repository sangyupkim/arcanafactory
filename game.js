// ================================
// 아르카나 팩토리 - Phase 1
// 탑뷰 마을 + 기지 그리드 시스템
// ================================

const GAME_WIDTH  = 960;
const GAME_HEIGHT = 540;

// ── FieldScene 전용 확장 필드
const FIELD_W    = 1440;   // 논리 필드 너비 (카메라 줌으로 더 넓게 보임)
const FIELD_H    = 810;    // 논리 필드 높이
const FIELD_ZOOM = 0.72;   // 카메라 줌 (낮을수록 화면에 더 넓게 보임)

const TILE      = 32;
const GRID_COLS = 20;
const GRID_ROWS = 15;
const GRID_OFFSET_X = (GAME_WIDTH  - GRID_COLS * TILE) / 2;
const GRID_OFFSET_Y = 50;

const ENERGY_ITEMS = {
  energy_basic: { label: '에너지 파편', icon: '⚡', power: 1,  color: '#f1c40f' },
  energy_mid:   { label: '압축 에너지', icon: '🔆', power: 5,  color: '#e67e22' },
  energy_high:  { label: '순수 에너지', icon: '💠', power: 20, color: '#3498db' },
};

const BUILDING_DEFS = {
  miner:    { label: '채굴기',      color: 0x4a2c8a, icon: '⛏️', baseW: 4, baseH: 2, resource: 'copper',  rate: 1,  isPipe: false, isEnergyStorage: false, isWarehouse: false, isBossGate: false, isMiner: true,  isLumber: false },
  lumber:   { label: '벌목소',      color: 0x2a5a1a, icon: '🪓', baseW: 4, baseH: 2, resource: 'pine',    rate: 1,  isPipe: false, isEnergyStorage: false, isWarehouse: false, isBossGate: false, isMiner: false, isLumber: true  },
  refinery: { label: '정제기',      color: 0x1a4a6a, icon: '🔧', baseW: 4, baseH: 2, resource: '',        rate: 0,  isPipe: false, isEnergyStorage: false, isWarehouse: false, isBossGate: false, isMiner: false, isLumber: false },
  estore:   { label: '에너지저장고', color: 0x7a4a00, icon: '🔋', baseW: 4, baseH: 2, resource: '',        rate: 0,  isPipe: false, isEnergyStorage: true,  isWarehouse: false, isBossGate: false, isMiner: false, isLumber: false },
  warehouse:{ label: '창고',         color: 0x2a4a6a, icon: '📦', baseW: 4, baseH: 2, resource: '',        rate: 0,  isPipe: false, isEnergyStorage: false, isWarehouse: true,  isBossGate: false, isMiner: false, isLumber: false },
  bossgate: { label: '보스 게이트',  color: 0x4a0a0a, icon: '🌀', baseW: 4, baseH: 3, resource: '',        rate: 0,  isPipe: false, isEnergyStorage: false, isWarehouse: false, isBossGate: true,  isMiner: false, isLumber: false },
  pipe:     { label: '파이프',        color: 0x1a3a2a, icon: '🔗', baseW: 1, baseH: 1, resource: '',        rate: 0,  isPipe: true,  isEnergyStorage: false, isWarehouse: false, isBossGate: false, isMiner: false, isLumber: false },
  workshop: { label: '제작소',        color: 0x1a1a4a, icon: '⚗️', baseW: 4, baseH: 2, resource: '',        rate: 0,  isPipe: false, isEnergyStorage: false, isWarehouse: false, isBossGate: false, isMiner: false, isLumber: false, isWorkshop: true  },
  smithy:   { label: '대장간',        color: 0x2a1a0a, icon: '⚒️', baseW: 4, baseH: 2, resource: '',        rate: 0,  isPipe: false, isEnergyStorage: false, isWarehouse: false, isBossGate: false, isMiner: false, isLumber: false, isSmithy:   true  },
};

// 건물 티어 업그레이드 정의
const BUILDING_UPGRADE_DEFS = {
  miner:  [
    null,
    { tier:2, label:'Tier 2 (철)',   costs:[{id:'copper_board',qty:20}] },
    { tier:3, label:'Tier 3 (다이아)',costs:[{id:'copper_board',qty:40},{id:'iron_board',qty:20}] },
    { tier:4, label:'Tier 4 (아다만티움)', costs:[{id:'iron_board',qty:40},{id:'diamond_board',qty:20}] },
  ],
  lumber: [
    null,
    { tier:2, label:'Tier 2 (흑단)',      costs:[{id:'copper_board',qty:20}] },
    { tier:3, label:'Tier 3 (고대오크)',  costs:[{id:'copper_board',qty:40},{id:'iron_board',qty:20}] },
    { tier:4, label:'Tier 4 (정령깃든나무)',costs:[{id:'iron_board',qty:40},{id:'diamond_board',qty:20}] },
  ],
};

// 광물/나무 티어 자원 배열
const MINERAL_TIERS = ['copper','iron','diamond','adamantium','mithril','orichalcum'];
const WOOD_TIERS    = ['pine','ebony','ancient_oak','spirit_tree','elf_wood','world_tree'];

// 보스게이트 에너지 충전 요구량 (stage -> cost)
const BOSS_GATE_COST = {
  '1-BOSS': 30,   // 에너지 파편 기준
};

const ESTORE_UPGRADES = [
  { level: 1, slots: 1,  slotSize: 100, label: 'Lv.1',     upgradeCost: 50  },
  { level: 2, slots: 2,  slotSize: 100, label: 'Lv.2',     upgradeCost: 150 },
  { level: 3, slots: 3,  slotSize: 100, label: 'Lv.3',     upgradeCost: 300 },
  { level: 4, slots: 5,  slotSize: 200, label: 'Lv.4',     upgradeCost: 600 },
  { level: 5, slots: 10, slotSize: 500, label: 'Lv.5 MAX', upgradeCost: null },
];

// 아이템 툴팁 설명
const ITEM_TOOLTIPS = {
  mineral:         '채굴기로 생산되는 기본 자원',
  energy_basic:    '기지 건물 동력원. 파편 상태',
  energy_mid:      '기지 건물 동력원. 압축 상태 (×5)',
  energy_high:     '기지 건물 동력원. 순수 상태 (×20)',
  core_efficiency: '건물에 장착 → 생산 효율 +20%',
  core_reduce:     '건물에 장착 → 에너지 소모 -25%',
  gold:            '골드 — 상단 별도 표시',
  gate_shard:      '차원의 파편 — 다음 구역 해금',
  upgrade_crystal: '강화 결정 — 건물 강화 가능',
  copper:          '1티어 광물. 채굴기(Tier 1)에서 생산',
  iron:            '2티어 광물. 채굴기(Tier 2)에서 생산',
  diamond:         '3티어 광물. 채굴기(Tier 3)에서 생산',
  adamantium:      '4티어 광물. 채굴기(Tier 4)에서 생산',
  mithril:         '5티어 광물. 채굴기(Tier 5)에서 생산',
  orichalcum:      '6티어 광물. 채굴기(Tier 6)에서 생산',
  pine:            '1티어 나무. 벌목소(Tier 1)에서 생산',
  ebony:           '2티어 나무. 벌목소(Tier 2)에서 생산',
  ancient_oak:     '3티어 나무. 벌목소(Tier 3)에서 생산',
  spirit_tree:     '4티어 나무. 벌목소(Tier 4)에서 생산',
  elf_wood:        '5티어 나무. 벌목소(Tier 5)에서 생산',
  world_tree:      '6티어 나무. 벌목소(Tier 6)에서 생산',
  hard_copper:     '제작소에서 구리×5로 제작',
  hard_iron:       '제작소에서 철×5로 제작',
  hard_diamond:    '제작소에서 다이아×5로 제작',
  tough_pine:      '제작소에서 소나무×5로 제작',
  tough_ebony:     '제작소에서 흑단×5로 제작',
  tough_oak:       '제작소에서 고대오크×5로 제작',
  copper_board:    '단단한 구리+튼튼한 소나무로 제작. 건물 건설에 사용',
  iron_board:      '단단한 철+튼튼한 흑단으로 제작',
  diamond_board:   '단단한 다이아+튼튼한 고대오크로 제작',
  sword_t1:        '구리검 — 장착 시 ATK +15',
  armor_t1:        '소나무 갑옷 — 장착 시 DEF +8, MaxHP +30',
  helmet_t1:       '구리 투구 — 장착 시 DEF +5',
  shoes_t1:        '구리 신발 — 장착 시 SPD +20',
  gloves_t1:       '구리 장갑 — 장착 시 ATK +8',
  sword_t2:        '철검 — 장착 시 ATK +35',
  armor_t2:        '흑단 갑옷 — 장착 시 DEF +18, MaxHP +60',
  helmet_t2:       '철 투구 — 장착 시 DEF +10',
  shoes_t2:        '철 신발 — 장착 시 SPD +40',
  gloves_t2:       '철 장갑 — 장착 시 ATK +18',
};

const INV_COLS = 10;
const INV_ROWS = 3;
const INV_MAX  = 999;

const ITEM_DEFS = {
  // ── 기지 자원 (구버전 호환)
  mineral:         { label: '광물',           icon: '⛏️', color: 0x9b59b6, bg: 0x2a1a4a },
  // ── 에너지 (필드 드롭 전용)
  energy_basic:    { label: '에너지 파편',    icon: '⚡', color: 0xf1c40f, bg: 0x2a2000 },
  energy_mid:      { label: '압축 에너지',    icon: '🔆', color: 0xe67e22, bg: 0x3a1500 },
  energy_high:     { label: '순수 에너지',    icon: '💠', color: 0x3498db, bg: 0x00103a },
  // ── 코어
  core_efficiency: { label: '효율 코어',      icon: '🟡', color: 0xf39c12, bg: 0x2a1a00 },
  core_reduce:     { label: '절약 코어',      icon: '🔵', color: 0x2980b9, bg: 0x001a2a },
  // ── 골드
  gold:            { label: '골드',           icon: '🪙', color: 0xf1c40f, bg: 0x3a3000 },
  // ── 보스 드롭
  gate_shard:      { label: '차원의 파편',    icon: '🔮', color: 0x9b59b6, bg: 0x1a0a2a },
  upgrade_crystal: { label: '강화 결정',      icon: '💎', color: 0x1abc9c, bg: 0x001a18 },
  potion:          { label: '포션',           icon: '🧪', color: 0x2ecc71, bg: 0x003a1a },
  // ── 광물 (6 티어)
  copper:          { label: '구리',           icon: '🟤', color: 0xcd7f32, bg: 0x1a0a00 },
  iron:            { label: '철',             icon: '⚙️', color: 0x8a9ba8, bg: 0x0e1520 },
  diamond:         { label: '다이아',         icon: '💎', color: 0x88ddff, bg: 0x00101e },
  adamantium:      { label: '아다만티움',     icon: '🔷', color: 0x4488cc, bg: 0x000a1e },
  mithril:         { label: '미스릴',         icon: '🌙', color: 0xaabbdd, bg: 0x050810 },
  orichalcum:      { label: '오리하르콘',     icon: '⭐', color: 0xffcc44, bg: 0x150d00 },
  // ── 나무 (6 티어)
  pine:            { label: '소나무',         icon: '🌲', color: 0x77bb55, bg: 0x081200 },
  ebony:           { label: '흑단나무',       icon: '🌳', color: 0x44663a, bg: 0x040a02 },
  ancient_oak:     { label: '고대오크',       icon: '🍀', color: 0x44aa88, bg: 0x001a10 },
  spirit_tree:     { label: '정령깃든나무',   icon: '✨', color: 0x88ffcc, bg: 0x00100a },
  elf_wood:        { label: '엘프나무',       icon: '🍃', color: 0x66ddaa, bg: 0x001508 },
  world_tree:      { label: '세계수가지',     icon: '🌿', color: 0xaaffcc, bg: 0x001510 },
  // ── 가공 재료
  hard_copper:     { label: '단단한 구리',    icon: '🔩', color: 0xcc8844, bg: 0x180a00 },
  hard_iron:       { label: '단단한 철',      icon: '🔩', color: 0x8899aa, bg: 0x0e1520 },
  hard_diamond:    { label: '단단한 다이아',  icon: '🔩', color: 0x88ccff, bg: 0x00101a },
  tough_pine:      { label: '튼튼한 소나무',  icon: '🪵', color: 0xcc8844, bg: 0x100800 },
  tough_ebony:     { label: '튼튼한 흑단',    icon: '🪵', color: 0x558844, bg: 0x040900 },
  tough_oak:       { label: '튼튼한 고대오크',icon: '🪵', color: 0x44aa88, bg: 0x001a10 },
  // ── 판자
  copper_board:    { label: '구리판자',       icon: '📋', color: 0xcc8844, bg: 0x1a0e00 },
  iron_board:      { label: '철판자',         icon: '📋', color: 0x8899aa, bg: 0x0e1520 },
  diamond_board:   { label: '다이아판자',     icon: '📋', color: 0x88ccff, bg: 0x001018 },
  // ── 장비 (티어 1)
  sword_t1:        { label: '구리검',         icon: '⚔️', color: 0xcd7f32, bg: 0x1a0a00, isEquip:true, slot:'weapon', atk:15 },
  armor_t1:        { label: '소나무 갑옷',    icon: '🛡️', color: 0x77bb55, bg: 0x081200, isEquip:true, slot:'armor',  def:8, maxHp:30 },
  helmet_t1:       { label: '구리 투구',      icon: '⛑️', color: 0xcd7f32, bg: 0x1a0a00, isEquip:true, slot:'helmet', def:5 },
  shoes_t1:        { label: '구리 신발',      icon: '👟', color: 0xcd7f32, bg: 0x1a0a00, isEquip:true, slot:'shoes',  spd:20 },
  gloves_t1:       { label: '구리 장갑',      icon: '🧤', color: 0xcd7f32, bg: 0x1a0a00, isEquip:true, slot:'gloves', atk:8 },
  // ── 장비 (티어 2)
  sword_t2:        { label: '철검',           icon: '⚔️', color: 0x8a9ba8, bg: 0x0e1520, isEquip:true, slot:'weapon', atk:35 },
  armor_t2:        { label: '흑단 갑옷',      icon: '🛡️', color: 0x44663a, bg: 0x040a02, isEquip:true, slot:'armor',  def:18, maxHp:60 },
  helmet_t2:       { label: '철 투구',        icon: '⛑️', color: 0x8a9ba8, bg: 0x0e1520, isEquip:true, slot:'helmet', def:10 },
  shoes_t2:        { label: '철 신발',        icon: '👟', color: 0x8a9ba8, bg: 0x0e1520, isEquip:true, slot:'shoes',  spd:40 },
  gloves_t2:       { label: '철 장갑',        icon: '🧤', color: 0x8a9ba8, bg: 0x0e1520, isEquip:true, slot:'gloves', atk:18 },
};

// 제작 레시피 (제작소 — 자원가공 + 판자)
const CRAFT_RECIPES = [
  // 자원 가공
  { id:'hard_copper',  cat:'가공', label:'단단한 구리',      inputs:[{id:'copper',qty:5}],                                    out:{id:'hard_copper',  qty:1}, time:'1분'  },
  { id:'hard_iron',    cat:'가공', label:'단단한 철',        inputs:[{id:'iron',qty:5}],                                      out:{id:'hard_iron',    qty:1}, time:'2분'  },
  { id:'hard_diamond', cat:'가공', label:'단단한 다이아',    inputs:[{id:'diamond',qty:5}],                                   out:{id:'hard_diamond', qty:1}, time:'3분'  },
  { id:'tough_pine',   cat:'가공', label:'튼튼한 소나무',    inputs:[{id:'pine',qty:5}],                                      out:{id:'tough_pine',   qty:1}, time:'1분'  },
  { id:'tough_ebony',  cat:'가공', label:'튼튼한 흑단',      inputs:[{id:'ebony',qty:5}],                                     out:{id:'tough_ebony',  qty:1}, time:'2분'  },
  { id:'tough_oak',    cat:'가공', label:'튼튼한 고대오크',  inputs:[{id:'ancient_oak',qty:5}],                               out:{id:'tough_oak',    qty:1}, time:'3분'  },
  // 판자 제작
  { id:'copper_board',  cat:'판자', label:'구리판자',   inputs:[{id:'hard_copper',qty:1},{id:'tough_pine',qty:1}],            out:{id:'copper_board',  qty:1}, time:'5분'  },
  { id:'iron_board',    cat:'판자', label:'철판자',     inputs:[{id:'hard_iron',qty:1},{id:'tough_ebony',qty:1}],             out:{id:'iron_board',    qty:1}, time:'10분' },
  { id:'diamond_board', cat:'판자', label:'다이아판자', inputs:[{id:'hard_diamond',qty:1},{id:'tough_oak',qty:1}],            out:{id:'diamond_board', qty:1}, time:'25분' },
];

// 대장장이 레시피 (장비 제작, 즉시)
const SMITH_RECIPES = [
  { id:'sword_t1',  cat:'티어1', label:'구리검',       inputs:[{id:'hard_copper',qty:10},{id:'tough_pine',qty:5}],   out:{id:'sword_t1',  qty:1} },
  { id:'armor_t1',  cat:'티어1', label:'소나무 갑옷',  inputs:[{id:'tough_pine',qty:10},{id:'hard_copper',qty:5}],   out:{id:'armor_t1',  qty:1} },
  { id:'helmet_t1', cat:'티어1', label:'구리 투구',    inputs:[{id:'tough_pine',qty:5},{id:'hard_copper',qty:5}],    out:{id:'helmet_t1', qty:1} },
  { id:'shoes_t1',  cat:'티어1', label:'구리 신발',    inputs:[{id:'hard_copper',qty:5}],                            out:{id:'shoes_t1',  qty:1} },
  { id:'gloves_t1', cat:'티어1', label:'구리 장갑',    inputs:[{id:'tough_pine',qty:5}],                             out:{id:'gloves_t1', qty:1} },
  { id:'sword_t2',  cat:'티어2', label:'철검',         inputs:[{id:'hard_iron',qty:10},{id:'tough_ebony',qty:5}],    out:{id:'sword_t2',  qty:1} },
  { id:'armor_t2',  cat:'티어2', label:'흑단 갑옷',    inputs:[{id:'tough_ebony',qty:10},{id:'hard_iron',qty:5}],    out:{id:'armor_t2',  qty:1} },
  { id:'helmet_t2', cat:'티어2', label:'철 투구',      inputs:[{id:'tough_ebony',qty:5},{id:'hard_iron',qty:5}],     out:{id:'helmet_t2', qty:1} },
  { id:'shoes_t2',  cat:'티어2', label:'철 신발',      inputs:[{id:'hard_iron',qty:5}],                              out:{id:'shoes_t2',  qty:1} },
  { id:'gloves_t2', cat:'티어2', label:'철 장갑',      inputs:[{id:'tough_ebony',qty:5}],                            out:{id:'gloves_t2', qty:1} },
];

// 글로벌 기지 상태 저장소 (마을 이동 시 유지용)
const BASE_DATA = { initialized: false, grid: null, buildings: [], pipes: [] };

// 아이템 분할 글로벌 모드 (ALL, HALF, ONE)
let GLOBAL_SPLIT_MODE = 'ALL';
const SPLIT_LABELS = { 'ALL': '전체', 'HALF': '절반', 'ONE': '1개' };

let isGameInitialized = false;

// ── 장비 시스템
const PLAYER_EQUIP = { weapon: null, armor: null, helmet: null, shoes: null, gloves: null };
const SLOT_LABELS  = { weapon:'무기', armor:'갑옷', helmet:'투구', shoes:'신발', gloves:'장갑' };

function equipItem(itemId) {
  const def = ITEM_DEFS[itemId];
  if (!def || !def.isEquip) return false;
  const slot = def.slot;
  const oldId = PLAYER_EQUIP[slot];
  // 기존 장비 해제 → 스탯 복원
  if (oldId) {
    const od = ITEM_DEFS[oldId];
    if (od.atk)   PLAYER_STATS.atk   -= od.atk;
    if (od.def)   PLAYER_STATS.def   -= od.def;
    if (od.spd)   PLAYER_STATS.spd   -= od.spd;
    if (od.maxHp) PLAYER_STATS.maxHp -= od.maxHp;
    playerInventory.add(oldId, 1);
  }
  // 새 장비 인벤토리에서 제거
  if (!playerInventory.consume(itemId, 1)) return false;
  PLAYER_EQUIP[slot] = itemId;
  if (def.atk)   PLAYER_STATS.atk   += def.atk;
  if (def.def)   PLAYER_STATS.def   += def.def;
  if (def.spd)   PLAYER_STATS.spd   += def.spd;
  if (def.maxHp) PLAYER_STATS.maxHp += def.maxHp;
  return true;
}

function unequipItem(slot) {
  const oldId = PLAYER_EQUIP[slot];
  if (!oldId) return false;
  const od = ITEM_DEFS[oldId];
  if (od.atk)   PLAYER_STATS.atk   -= od.atk;
  if (od.def)   PLAYER_STATS.def   -= od.def;
  if (od.spd)   PLAYER_STATS.spd   -= od.spd;
  if (od.maxHp) PLAYER_STATS.maxHp -= od.maxHp;
  playerInventory.add(oldId, 1);
  PLAYER_EQUIP[slot] = null;
  return true;
}

// ── 인벤토리 시스템 (이동 & 드래그앤드롭 로직 추가) ──
class Inventory {
  constructor(size = 30) {
    this.maxStack = INV_MAX;
    this.slots = Array.from({ length: size }, () => ({ itemId: null, count: 0 }));
  }
  add(itemId, amount = 1) {
    // 골드는 인벤토리에 저장 불가 — 글로벌 PLAYER_GOLD로만 관리
    if (itemId === 'gold') { PLAYER_GOLD += amount; return true; }
    let remaining = amount;
    for (const slot of this.slots) {
      if (slot.itemId !== itemId || remaining <= 0) continue;
      const space = this.maxStack - slot.count;
      const add   = Math.min(space, remaining);
      slot.count += add; remaining  -= add;
    }
    for (const slot of this.slots) {
      if (slot.itemId !== null || remaining <= 0) continue;
      const add  = Math.min(this.maxStack, remaining);
      slot.itemId = itemId; slot.count  = add; remaining  -= add;
    }
    return remaining <= 0;
  }
  consume(itemId, amount = 1) {
    const total = this.count(itemId);
    if (total < amount) return false;
    let remaining = amount;
    for (const slot of this.slots) {
      if (slot.itemId !== itemId || remaining <= 0) continue;
      const take = Math.min(slot.count, remaining);
      slot.count -= take; remaining  -= take;
      if (slot.count <= 0) { slot.itemId = null; slot.count = 0; }
    }
    return true;
  }
  count(itemId) {
    return this.slots.filter(s => s.itemId === itemId).reduce((s, sl) => s + sl.count, 0);
  }
  // 특정 슬롯 간 이동 및 나누기 로직
  move(fromIdx, toInv, toIdx, amount) {
    if (this === toInv && fromIdx === toIdx) return false;
    const source = this.slots[fromIdx];
    if (!source || !source.itemId || source.count <= 0) return false;
    const actAmt = Math.min(amount, source.count);
    if (actAmt <= 0) return false;

    const target = toInv.slots[toIdx];

    if (!target.itemId) {
      target.itemId = source.itemId; target.count = actAmt; source.count -= actAmt;
    } else if (target.itemId === source.itemId) {
      const space = toInv.maxStack - target.count;
      const moveAmt = Math.min(space, actAmt);
      target.count += moveAmt; source.count -= moveAmt;
    } else {
      // 꽉 찬 상태에서 스왑은 전체 이동일 때만 가능
      if (actAmt === source.count) {
        const tId = target.itemId, tCnt = target.count;
        target.itemId = source.itemId; target.count = source.count;
        source.itemId = tId; source.count = tCnt;
      } else return false;
    }
    if (source.count <= 0) { source.itemId = null; source.count = 0; }
    return true;
  }
}

class ItemStorage extends Inventory {
  constructor(label = '창고', size = 30, maxStack = 100) {
    super(size);
    this.label = label;
    this.maxStack = maxStack;
  }
}

const playerInventory = new Inventory();
const townStorage     = new ItemStorage('마을 창고');

// 골드 — 인벤토리 저장 안됨, 별도 글로벌 변수
let PLAYER_GOLD = 0;

class InventoryUI {
  constructor(scene, inv, options = {}) {
    this.scene = scene; this.inv = inv;
    this.title = options.title || '🎒 인벤토리';
    this.depth = options.depth || 95;
    this.onClose = options.onClose || null;
    this.cols = options.cols || Math.min(10, this.inv.slots.length);
    this.rows = options.rows || Math.ceil(this.inv.slots.length / this.cols);

    const SLOT = 46, GAP = 4, PAD = 8, HEADER = 38;
    this.pw = PAD*2 + SLOT*this.cols + GAP*(this.cols-1);
    this.ph = HEADER + PAD*2 + SLOT*this.rows + GAP*(this.rows-1) + PAD;
    this.ox = options.x !== undefined ? options.x : Math.floor((GAME_WIDTH - this.pw) / 2);
    this.oy = options.y !== undefined ? options.y : Math.floor((GAME_HEIGHT - this.ph) / 2);

    this.container = scene.add.container(this.ox, this.oy).setDepth(this.depth).setVisible(false);
    this.slotGfxList = []; this.slotTexts = [];
    this._build();
  }

  _build() {
    const { scene, pw, ph } = this;
    const c = this.container;
    const SLOT = 46, GAP = 4, PAD = 8;
    const HEADER = 38;  // 제목 + 버튼 영역 높이

    // ── 배경 ──
    c.add(scene.add.rectangle(0, 0, pw, ph, 0x0a0015, 0.97).setOrigin(0).setStrokeStyle(2, 0x6c3483));

    // ── 제목 (좌측 정렬) ──
    c.add(scene.add.text(PAD, 12, this.title, {
      fontSize:'14px', fill:'#c39bd3', fontFamily:'Arial', fontStyle:'bold'
    }).setOrigin(0, 0.5));

    // ── 이동 모드 버튼 (제목 오른쪽, 닫기 왼쪽) ──
    this.modeBtn = scene.add.text(pw - 70, 12, `[${SPLIT_LABELS[GLOBAL_SPLIT_MODE]}]`, {
      fontSize:'11px', fill:'#f1c40f', backgroundColor:'#2a1a0a',
      padding:{x:5, y:3}, fixedWidth: 50
    }).setOrigin(0, 0.5).setInteractive({useHandCursor:true});
    this.modeBtn.on('pointerdown', () => {
      GLOBAL_SPLIT_MODE = GLOBAL_SPLIT_MODE === 'ALL' ? 'HALF' : (GLOBAL_SPLIT_MODE === 'HALF' ? 'ONE' : 'ALL');
      scene.events.emit('updateSplitMode');
    });
    scene.events.on('updateSplitMode', () => {
      if (this.modeBtn?.active) this.modeBtn.setText(`[${SPLIT_LABELS[GLOBAL_SPLIT_MODE]}]`);
    });
    c.add(this.modeBtn);

    // ── 닫기 버튼 (우상단) ──
    const closeRect = scene.add.rectangle(pw - 18, 12, 22, 22, 0x3a1a2a).setOrigin(0.5).setInteractive({useHandCursor:true});
    const closeTxt  = scene.add.text(pw - 18, 12, '✕', { fontSize:'12px', fill:'#cc4444', fontFamily:'Arial' }).setOrigin(0.5);
    closeRect.on('pointerdown', () => this.hide());
    c.add([closeRect, closeTxt]);

    // ── 구분선 ──
    const divider = scene.add.rectangle(0, HEADER - 2, pw, 1, 0x4a2c6a).setOrigin(0);
    c.add(divider);

    // ── 슬롯 그리드 ──
    for (let i = 0; i < this.inv.slots.length; i++) {
      const row = Math.floor(i / this.cols), col = i % this.cols;
      const sx = PAD + col * (SLOT + GAP);
      const sy = HEADER + PAD + row * (SLOT + GAP);

      const slotBg = scene.add.rectangle(sx, sy, SLOT, SLOT, 0x1a0a2a).setOrigin(0).setStrokeStyle(1, 0x4a2c6a);
      slotBg.setInteractive({ dropZone: true });
      slotBg.inv = this.inv; slotBg.slotIdx = i;
      slotBg.isEnergyStorage = this.title.includes('에너지저장고');
      c.add(slotBg); this.slotGfxList.push(slotBg);

      // 아이콘: 슬롯 중앙
      const iconTxt = scene.add.text(sx + SLOT/2, sy + SLOT/2 - 4, '', {
        fontSize:'20px', fontFamily:'Arial'
      }).setOrigin(0.5);
      iconTxt.setInteractive({
        draggable: true,
        useHandCursor: true,
        hitArea: new Phaser.Geom.Rectangle(-23, -23, 46, 46),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains
      });
      iconTxt.inv = this.inv; iconTxt.slotIdx = i;

      // 클릭으로 이동
      slotBg.setInteractive({ dropZone: true, useHandCursor: true });
      slotBg.on('pointerdown', () => this._onSlotClick(i));

      // 아이템 이름: 슬롯 하단
      const nameTxt = scene.add.text(sx + SLOT/2, sy + SLOT - 5, '', {
        fontSize:'8px', fill:'#aaaaaa', fontFamily:'Arial'
      }).setOrigin(0.5, 1);

      // 수량: 슬롯 우하단
      const cntTxt = scene.add.text(sx + SLOT - 3, sy + SLOT - 3, '', {
        fontSize:'10px', fill:'#f1c40f', fontFamily:'Arial', fontStyle:'bold'
      }).setOrigin(1, 1);

      // 툴팁 — hover
      slotBg.on('pointerover', (ptr) => this._showTooltip(i, ptr));
      slotBg.on('pointerout',  ()    => this._hideTooltip());
      iconTxt.on('pointerover', (ptr) => this._showTooltip(i, ptr));
      iconTxt.on('pointerout',  ()    => this._hideTooltip());

      c.add([iconTxt, cntTxt, nameTxt]); this.slotTexts.push({ icon: iconTxt, count: cntTxt, name: nameTxt });
    }

    // 씬 단위 드래그 앤 드롭 이벤트 등록 (최초 1회)
    if (!scene._dragSetupDone) {
      scene.input.on('dragstart', (pointer, gameObject) => {
        if (!gameObject.inv || !gameObject.inv.slots[gameObject.slotIdx].itemId) return;
        gameObject.setDepth(1000).setAlpha(0.8);
        gameObject.ox = gameObject.x; gameObject.oy = gameObject.y;
      });
      scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (!gameObject.inv || !gameObject.inv.slots[gameObject.slotIdx].itemId) return;
        gameObject.x = dragX; gameObject.y = dragY;
      });
      scene.input.on('dragend', (pointer, gameObject) => {
        if (!gameObject.inv) return;
        gameObject.setDepth(0).setAlpha(1);
        gameObject.x = gameObject.ox; gameObject.y = gameObject.oy; // 제자리 복귀
      });
      scene.input.on('drop', (pointer, gameObject, dropZone) => {
        if (!gameObject.inv || !dropZone.inv) return;
        if (!gameObject.inv.slots[gameObject.slotIdx].itemId) return;

        const srcCnt = gameObject.inv.slots[gameObject.slotIdx].count;
        const amt = GLOBAL_SPLIT_MODE === 'HALF' ? Math.ceil(srcCnt/2) : (GLOBAL_SPLIT_MODE === 'ONE' ? 1 : srcCnt);

        if (dropZone.isEnergyStorage && !gameObject.inv.slots[gameObject.slotIdx].itemId.startsWith('energy_')) {
          if (scene._showHint) scene._showHint('❌ 에너지만 넣을 수 있습니다!');
          return;
        }

        gameObject.inv.move(gameObject.slotIdx, dropZone.inv, dropZone.slotIdx, amt);

        // 화면의 모든 UI 갱신
        if(scene.inventoryUI) scene.inventoryUI.refresh();
        if(scene.storageUI)   scene.storageUI.refresh();
        if(scene._refreshPopupSlots) scene._refreshPopupSlots();
      });
      scene._dragSetupDone = true;
    }
  }

  refresh() {
    for (let i = 0; i < this.inv.slots.length; i++) {
      const slot = this.inv.slots[i];
      const { icon, count, name } = this.slotTexts[i];
      if (slot && slot.itemId) {
        const def = ITEM_DEFS[slot.itemId];
        icon.setText(def ? def.icon : '?');
        count.setText(slot.count >= this.inv.maxStack ? 'MAX' : String(slot.count));
        if (name) name.setText('');  // 아이콘 있으면 이름 숨김 (공간 절약)
        this.slotGfxList[i].setFillStyle(def ? def.bg : 0x1a0a2a);
      } else {
        icon.setText(''); count.setText('');
        if (name) name.setText('');
        this.slotGfxList[i].setFillStyle(0x1a0a2a);
      }
    }
  }

  // ── 클릭 이동: 선택된 슬롯 → 다른 슬롯으로 이동
  _onSlotClick(idx) {
    const scene = this.scene;
    const sel = scene._invSel;

    if (!sel) {
      // 1차 클릭 — 선택
      const slot = this.inv.slots[idx];
      if (!slot?.itemId) return;
      scene._invSel = { ui: this, idx };
      this.slotGfxList[idx]?.setStrokeStyle(2, 0xf1c40f);
    } else {
      // 2차 클릭 — 이동
      const { ui: srcUi, idx: srcIdx } = sel;
      scene._invSel = null;
      srcUi.slotGfxList[srcIdx]?.setStrokeStyle(1, 0x4a2c6a); // 선택 해제

      if (srcUi === this && srcIdx === idx) return; // 같은 슬롯 → 선택 취소

      const srcSlot = srcUi.inv.slots[srcIdx];
      if (!srcSlot?.itemId) return;

      // 골드는 이동 불가
      if (srcSlot.itemId === 'gold') {
        if (scene._showHint) scene._showHint('🪙 골드는 별도 관리됩니다');
        return;
      }

      // 대상이 에너지저장고 / 보스게이트면 에너지 아이템만 허용
      const destIsEnergySlot = this.title.includes('에너지저장고') || this.title.includes('보스 게이트');
      if (destIsEnergySlot && !srcSlot.itemId.startsWith('energy_')) {
        if (scene._showHint) scene._showHint('❌ 에너지 아이템만 넣을 수 있습니다');
        return;
      }

      const amt = GLOBAL_SPLIT_MODE === 'HALF' ? Math.ceil(srcSlot.count / 2)
                : GLOBAL_SPLIT_MODE === 'ONE'  ? 1
                : srcSlot.count;

      srcUi.inv.move(srcIdx, this.inv, idx, amt);

      // 모든 열린 UI 갱신
      srcUi.refresh();
      this.refresh();
      if (scene.inventoryUI)        scene.inventoryUI.refresh();
      if (scene.storageUI)          scene.storageUI.refresh();
      if (scene._refreshPopupSlots) scene._refreshPopupSlots();
    }
  }

  _clearSelection() {
    const scene = this.scene;
    if (scene._invSel) {
      scene._invSel.ui.slotGfxList[scene._invSel.idx]?.setStrokeStyle(1, 0x4a2c6a);
      scene._invSel = null;
    }
    this._selectedSlot = undefined;
  }

  // ── 툴팁 (씬 절대좌표 기준, depth 300으로 최상단)
  _showTooltip(idx, ptr) {
    this._hideTooltip();
    const slot = this.inv.slots[idx]; if (!slot?.itemId) return;
    const def  = ITEM_DEFS[slot.itemId]; if (!def) return;
    const scene = this.scene;

    const lines = [`${def.icon}  ${def.label}`, `보유: ${slot.count}개`];
    const desc  = ITEM_TOOLTIPS[slot.itemId];
    if (desc) lines.push(desc);

    const LH = 16, TW = 170, TH = 12 + lines.length * LH;
    // ptr.worldX/Y 는 화면 좌표 기준으로 정확
    const wx = ptr.worldX !== undefined ? ptr.worldX : ptr.x;
    const wy = ptr.worldY !== undefined ? ptr.worldY : ptr.y;
    const tx = Math.min(wx + 14, GAME_WIDTH  - TW - 4);
    const ty = Math.max(wy - TH - 10, 56);

    this._tooltipObjs = [];
    const bg = scene.add.rectangle(tx, ty, TW, TH, 0x060010, 0.97)
      .setOrigin(0).setDepth(300).setStrokeStyle(1, 0x7c3aad);
    this._tooltipObjs.push(bg);
    lines.forEach((l, i) => {
      const col = i === 0 ? '#f5d020' : i === 1 ? '#99aaff' : '#bbbbbb';
      const sz  = i === 0 ? '12px' : '10px';
      const t = scene.add.text(tx + 7, ty + 5 + i * LH, l, {
        fontSize: sz, fill: col, fontFamily: 'Arial'
      }).setDepth(301).setOrigin(0);
      this._tooltipObjs.push(t);
    });
  }

  _hideTooltip() {
    if (this._tooltipObjs) { this._tooltipObjs.forEach(o => { try{o.destroy();}catch(e){} }); }
    this._tooltipObjs = null;
  }

  show() { this.refresh(); this.container.setVisible(true); }
  hide() { this.container.setVisible(false); if (this.onClose) this.onClose(); }
  toggle() { this.container.visible ? this.hide() : this.show(); }
  get visible() { return this.container.visible; }
  destroy() { this.container.destroy(); }
}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  preload() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0020).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, '🔮 ARCANA FACTORY', { fontSize: '28px', fill: '#c39bd3', fontFamily: 'Arial' }).setOrigin(0.5);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2 + 40, 0, 16, 0x9b59b6).setOrigin(0, 0.5);
    this.load.on('progress', v => { bar.width = 400 * v; });
  }
  create() { this.time.delayedCall(600, () => this.scene.start('TitleScene')); }
}

class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }
  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0020).setOrigin(0);
    this.add.rectangle(0, GAME_HEIGHT * 0.65, GAME_WIDTH, GAME_HEIGHT * 0.35, 0x1a0040).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 150, '🔮', { fontSize: '60px' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 230, 'ARCANA FACTORY', { fontSize: '38px', fill: '#c39bd3', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 272, '아르카나 팩토리', { fontSize: '17px', fill: '#9b59b6', fontFamily: 'Arial' }).setOrigin(0.5);
    const btn = this.add.rectangle(GAME_WIDTH / 2, 390, 200, 46, 0x6c3483).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, 390, '▶  게임 시작', { fontSize: '18px', fill: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('HubScene'));
  }
}

class HubScene extends Phaser.Scene {
  constructor() { super('HubScene'); }
  create() {
    this.cameras.main.fadeIn(300);
    if (!isGameInitialized) {
      if (playerInventory.count('energy_basic')===0 && playerInventory.slots.every(s=>!s.itemId)) {
        playerInventory.add('energy_basic', 20);  // 초기 지급 (테스트용 소량)
      }
      isGameInitialized = true;
    }
    this.add.rectangle(0, 50, GAME_WIDTH, GAME_HEIGHT - 50, 0x1a3a1a).setOrigin(0);
    for (let x = 0; x < GAME_WIDTH; x += 40)
      for (let y = 50; y < GAME_HEIGHT; y += 40)
        if ((Math.floor(x/40)+Math.floor((y-50)/40)) % 2 === 0)
          this.add.rectangle(x, y, 40, 40, 0x1e421e).setOrigin(0);

    this.baseZone    = this._createBuilding(160, 280, '🏗️', '기지',      0x1a4a2e, 0x2ecc71, '기지로 이동',       'BaseScene');
    this.fieldZone   = this._createBuilding(800, 280, '🌲', '필드',      0x4a1a1a, 0xe74c3c, '필드로 이동',       'StageSelectScene');
    this.smithZone   = this._createBuilding(640, 130, '⚒️', '대장간',    0x2a1a0a, 0xe67e22, '대장간으로 이동',   'SmithScene');
    this.storageZone = this._createBuilding(480, 390, '📦', '마을창고',  0x1a3a4a, 0xf1c40f, '[E] 창고 열기',     null);

    // 제작소는 기지(BaseScene) 내부에서 건설
    this.add.rectangle(320, 130, 110, 110, 0x0e0e1a).setOrigin(0.5).setAlpha(0.7);
    this.add.rectangle(320, 130, 112, 112, 0x222255, 0).setOrigin(0.5).setStrokeStyle(1, 0x333366);
    this.add.text(320, 105, '⚗️', { fontSize: '28px' }).setOrigin(0.5).setAlpha(0.4);
    this.add.text(320, 140, '제작소', { fontSize: '13px', fill: '#444477', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(320, 158, '기지에서 건설', { fontSize: '10px', fill: '#333355', fontFamily: 'Arial' }).setOrigin(0.5);

    this.player    = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, 24, 24, 0xf0e6ff).setDepth(5);
    this.playerDir = this.add.triangle(GAME_WIDTH/2, GAME_HEIGHT/2-16, 0,8, 8,-8, -8,-8, 0xc39bd3).setDepth(6);
    this.playerSpeed = 180; this.facing = 'down';

    this.portalHint = this.add.text(GAME_WIDTH/2, GAME_HEIGHT-30, '', {
      fontSize: '14px', fill: '#ffffff', fontFamily: 'Arial', backgroundColor: '#00000088', padding: { x:10, y:4 }
    }).setOrigin(0.5).setDepth(10);

    this._buildHUD();

    this.storageUI = new InventoryUI(this, townStorage, { title: '📦 마을 창고', depth: 95, onClose: () => { this.storageOpen = false; } });
    this.storageOpen = false;
    this.inventoryUI = new InventoryUI(this, playerInventory, { title: '🎒 인벤토리', depth: 96, y: 30 });
    this.goldBg  = this.add.rectangle(GAME_WIDTH-4,4,120,22,0x2a2000,0.9).setOrigin(1,0).setDepth(12).setStrokeStyle(1,0x888800);
    this.goldText= this.add.text(GAME_WIDTH-8,15,`🪙 ${PLAYER_GOLD}`,{fontSize:'12px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,0.5).setDepth(13);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({ W: 87, A: 65, S: 83, D: 68 });
    this.keyE = this.input.keyboard.addKey(69);
    this.keyI = this.input.keyboard.addKey(73);
    this.keyEsc = this.input.keyboard.addKey(27);

    this.keyE.on('down', () => {
      if (Phaser.Geom.Rectangle.Contains(this.storageZone, this.player.x, this.player.y)) {
        this.storageOpen = !this.storageOpen;
        this.storageOpen ? this.storageUI.show() : this.storageUI.hide();
      }
    });
    this.keyI.on('down', () => this.inventoryUI.toggle());
    this.keyEsc.on('down', () => { this.storageUI.hide(); this.inventoryUI.hide(); });

    this.joystick = new VirtualJoystick(this, 100, GAME_HEIGHT - 90);
    this._buildMobileButtons();

    // ── 치트 버튼 (테스트용 에너지 지급)
    const cheatBg = this.add.rectangle(68, GAME_HEIGHT - 28, 116, 26, 0x1a1a00, 0.88)
      .setDepth(30).setStrokeStyle(1, 0x555500).setInteractive({ useHandCursor: true });
    this.add.text(68, GAME_HEIGHT - 28, '⚡ 에너지 +100 [치트]', { fontSize: '9px', fill: '#888822', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(31);
    cheatBg.on('pointerdown', () => {
      playerInventory.add('energy_basic', 100);
      const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⚡ 에너지 100 획득!', {
        fontSize: '20px', fill: '#f1c40f', fontFamily: 'Arial', fontStyle: 'bold',
        backgroundColor: '#00000099', padding: { x: 14, y: 8 }
      }).setOrigin(0.5).setDepth(100);
      this.tweens.add({ targets: msg, alpha: 0, y: msg.y - 40, duration: 1200, onComplete: () => msg.destroy() });
    });
  }

  _buildMobileButtons() {
    const D = 30; // button depth
    const mkBtn = (x, y, w, h, icon, label, color, cb) => {
      const bg = this.add.rectangle(x, y, w, h, color, 0.9)
        .setDepth(D).setStrokeStyle(2, 0xffffff, 0.15).setInteractive({ useHandCursor: true });
      this.add.text(x, y - 5, icon, { fontSize: '18px' }).setOrigin(0.5).setDepth(D + 1);
      this.add.text(x, y + 11, label, { fontSize: '9px', fill: '#cccccc', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(D + 1);
      bg.on('pointerdown', cb);
      bg.on('pointerover', () => bg.setFillStyle(0x4a4a7a, 0.95));
      bg.on('pointerout', () => bg.setFillStyle(color, 0.9));
      return bg;
    };
    // 상호작용 (E)
    mkBtn(GAME_WIDTH - 68, GAME_HEIGHT - 68, 80, 60, '⚡', '상호작용', 0x2a2a5a, () => {
      if (Phaser.Geom.Rectangle.Contains(this.storageZone, this.player.x, this.player.y)) {
        this.storageOpen = !this.storageOpen;
        this.storageOpen ? this.storageUI.show() : this.storageUI.hide();
      }
    });
    // 인벤토리 (I)
    mkBtn(GAME_WIDTH - 68, GAME_HEIGHT - 138, 80, 60, '🎒', '인벤토리', 0x1a3a1a, () => this.inventoryUI.toggle());
  }

  _buildHUD() {
    this.add.rectangle(0, 0, GAME_WIDTH, 50, 0x0a0015).setOrigin(0).setDepth(10);
    this.add.rectangle(0, 49, GAME_WIDTH, 2, 0x6c3483).setOrigin(0).setDepth(10);
    const ps = PLAYER_STATS;
    this.hudLevelTxt = this.add.text(16, 14, `⚔️ Lv.${ps.level}  ${ps.job}`, { fontSize: '14px', fill: '#c39bd3', fontFamily: 'Arial' }).setDepth(10);
    this.hudStatTxt  = this.add.text(180, 14, `ATK:${ps.atk}  DEF:${ps.def}  HP:${ps.maxHp}`, { fontSize: '11px', fill: '#887799', fontFamily: 'Arial' }).setDepth(10);
    // 장착 아이콘 표시
    this.hudEquipTxt = this.add.text(420, 14, this._getEquipSummary(), { fontSize: '10px', fill: '#886644', fontFamily: 'Arial' }).setDepth(10);
    this.add.text(GAME_WIDTH-200, 14, 'WASD:이동  E:창고/상호작용  I:인벤토리', { fontSize: '9px', fill: '#334433', fontFamily: 'Arial' }).setDepth(10);
  }

  _getEquipSummary() {
    const parts = [];
    Object.entries(PLAYER_EQUIP).forEach(([slot,id])=>{
      if (id) parts.push(ITEM_DEFS[id]?.icon||'?');
    });
    return parts.length ? parts.join(' ') : '장비 없음';
  }

  _createBuilding(x, y, icon, label, bgColor, accentColor, hint, scene) {
    this.add.rectangle(x+4, y+4, 110, 110, 0x000000).setAlpha(0.4).setOrigin(0.5);
    this.add.rectangle(x, y, 110, 110, bgColor).setOrigin(0.5);
    this.add.rectangle(x, y, 112, 112, accentColor, 0).setOrigin(0.5).setStrokeStyle(2, accentColor);
    this.add.text(x, y-10, icon, { fontSize: '30px' }).setOrigin(0.5);
    this.add.text(x, y+28, label, { fontSize: '15px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    const zone = new Phaser.Geom.Rectangle(x-60, y-60, 120, 120);
    zone.hint = hint; zone.targetScene = scene;
    return zone;
  }

  update(t, delta) {
    const dt = delta / 1000;
    let vx = 0, vy = 0;
    if (this.wasd.A.isDown || this.cursors.left.isDown)  { vx = -this.playerSpeed; this.facing = 'left'; }
    if (this.wasd.D.isDown || this.cursors.right.isDown) { vx =  this.playerSpeed; this.facing = 'right'; }
    if (this.wasd.W.isDown || this.cursors.up.isDown)    { vy = -this.playerSpeed; this.facing = 'up'; }
    if (this.wasd.S.isDown || this.cursors.down.isDown)  { vy =  this.playerSpeed; this.facing = 'down'; }
    if (this.joystick.active) { vx = this.joystick.vx*this.playerSpeed; vy = this.joystick.vy*this.playerSpeed; }
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    if (this.storageUI.visible || this.inventoryUI.visible) { vx = 0; vy = 0; }

    const nx = Phaser.Math.Clamp(this.player.x + vx*dt, 12, GAME_WIDTH-12);
    const ny = Phaser.Math.Clamp(this.player.y + vy*dt, 62, GAME_HEIGHT-12);
    this.player.setPosition(nx, ny);
    this.playerDir.setPosition(nx, ny-16).setAngle({ up:0, down:180, left:270, right:90 }[this.facing] || 0);

    let nearHint = '';
    const zones = [ { zone: this.baseZone, scene: 'BaseScene' }, { zone: this.fieldZone, scene: 'StageSelectScene' }, { zone: this.smithZone, scene: 'SmithScene' } ];
    for (const { zone, scene } of zones) {
      if (Phaser.Geom.Rectangle.Contains(zone, nx, ny)) {
        nearHint = zone.hint;
        if (!this._enterTimer) this._enterTimer = this.time.delayedCall(600, () => { this.scene.start(scene); });
      }
    }
    if (Phaser.Geom.Rectangle.Contains(this.storageZone, nx, ny)) nearHint = '[E] 창고 열기';
    const inZone = zones.some(({ zone }) => Phaser.Geom.Rectangle.Contains(zone, nx, ny));
    if (!inZone && this._enterTimer) { this._enterTimer.remove(); this._enterTimer = null; }

    this.portalHint.setText(nearHint);
    this.joystick.update(this);
    if (this.goldText) this.goldText.setText(`🪙 ${PLAYER_GOLD}`);
    const ps=PLAYER_STATS;
    if (this.hudLevelTxt) this.hudLevelTxt.setText(`⚔️ Lv.${ps.level}  ${ps.job}`);
    if (this.hudStatTxt)  this.hudStatTxt.setText(`ATK:${ps.atk}  DEF:${ps.def}  HP:${ps.maxHp}`);
    if (this.hudEquipTxt) this.hudEquipTxt.setText(this._getEquipSummary());
  }
}

class VirtualJoystick {
  constructor(scene, x, y) {
    this.baseX = x; this.baseY = y; this.radius = 50; this.vx = 0; this.vy = 0; this.active = false; this.pointerId = null;
    this.base  = scene.add.circle(x, y, this.radius, 0xffffff, 0.08).setDepth(20).setStrokeStyle(2, 0xffffff, 0.2);
    this.stick = scene.add.circle(x, y, 20, 0xffffff, 0.25).setDepth(21);
    scene.input.on('pointerdown', (p) => {
      if (p.x < GAME_WIDTH / 2 && p.y > GAME_HEIGHT / 2) {
        this.pointerId = p.id; this.active = true; this.baseX = p.x; this.baseY = p.y;
        this.base.setPosition(p.x, p.y); this.stick.setPosition(p.x, p.y);
      }
    });
    scene.input.on('pointermove', (p) => {
      if (p.id !== this.pointerId) return;
      const dx = p.x - this.baseX, dy = p.y - this.baseY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const clamped = Math.min(dist, this.radius);
      const angle = Math.atan2(dy, dx);
      this.vx = Math.cos(angle) * (clamped / this.radius);
      this.vy = Math.sin(angle) * (clamped / this.radius);
      this.stick.setPosition(this.baseX + Math.cos(angle)*clamped, this.baseY + Math.sin(angle)*clamped);
    });
    scene.input.on('pointerup', (p) => {
      if (p.id === this.pointerId) { this.active = false; this.pointerId = null; this.vx = 0; this.vy = 0; this.stick.setPosition(this.baseX, this.baseY); }
    });
  }
  update() { this.base.setAlpha(this.active ? 0.18 : 0.06); this.stick.setAlpha(this.active ? 0.35 : 0.12); }
  destroy() { this.base.destroy(); this.stick.destroy(); }
}

class BaseScene extends Phaser.Scene {
  constructor() { super('BaseScene'); }

  create() {
    this.cameras.main.fadeIn(300);
    this.px = GRID_OFFSET_X + GRID_COLS*TILE/2;
    this.py = GRID_OFFSET_Y + GRID_ROWS*TILE/2;
    this.speed = 180; this.facing = 'down';

    this.buildMode = false; this.buildType = null; this.ghostRot = false; this.ghostTiles = [];
    this.popupVisible = false; this.activeBuilding = null; this.nearbyBuilding = null;
    this.popupChildren = []; this.popupSlotGfx = []; this.popupSlotTxt = [];

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a100a).setOrigin(0);
    this.gridGfx = this.add.graphics().setDepth(1);
    this.pipeLineGfx = this.add.graphics().setDepth(7);

    // 기지 상태 복원
    if (!BASE_DATA.initialized) {
      this.grid = Array.from({ length: GRID_COLS }, () => Array(GRID_ROWS).fill(null));
      this.buildings = []; this.pipes = [];
      BASE_DATA.grid = this.grid; BASE_DATA.buildings = this.buildings; BASE_DATA.pipes = this.pipes;
      BASE_DATA.initialized = true;
    } else {
      this.grid = BASE_DATA.grid; this.buildings = BASE_DATA.buildings; this.pipes = BASE_DATA.pipes;
      this.buildings.forEach(b => {
        const def = BUILDING_DEFS[b.type];
        const bx = GRID_OFFSET_X+b.col*TILE, by = GRID_OFFSET_Y+b.row*TILE;
        b.gfx = [
          this.add.rectangle(bx,by,b.w*TILE,b.h*TILE,def.color).setOrigin(0).setDepth(10).setStrokeStyle(2,0x9b59b6),
          this.add.text(bx+b.w*TILE/2,by+b.h*TILE/2-8,def.icon,{fontSize:'20px'}).setOrigin(0.5).setDepth(11),
          this.add.text(bx+b.w*TILE/2,by+b.h*TILE/2+10,def.label,{fontSize:'10px',fill:'#ffffff',fontFamily:'Arial'}).setOrigin(0.5).setDepth(11)
        ];
      });
      this.pipes.forEach(p => {
        p.gfx = this.add.graphics().setDepth(9);
        p.gfx.fillStyle(0x1a3a2a,1).fillRect(GRID_OFFSET_X+p.col*TILE+4,GRID_OFFSET_Y+p.row*TILE+4,TILE-8,TILE-8);
      });
    }

    this._redrawGrid(); this._redrawPipeLines(); this._restorePauseOverlays();

    this.player    = this.add.rectangle(this.px,this.py,24,24,0xf0e6ff).setDepth(20);
    this.playerDir = this.add.triangle(this.px,this.py-16,0,8,8,-8,-8,-8,0xc39bd3).setDepth(21);

    this._buildHUD();
    this._buildBuildPanel();
    this._buildPopupContainer();

    this.interactPrompt = this.add.text(0,0,'[E]',{
      fontSize:'11px',fill:'#ffffff',fontFamily:'Arial',backgroundColor:'#00000099',padding:{x:5,y:2}
    }).setOrigin(0.5,1).setDepth(40).setVisible(false);

    // 플레이어 인벤토리 UI (팝업 열릴 때만 우측에 표시)
    this.inventoryUI = new InventoryUI(this, playerInventory, { title:'🎒 인벤토리', depth:95 });
    this.goldBg  = this.add.rectangle(GAME_WIDTH-4,4,120,22,0x2a2000,0.9).setOrigin(1,0).setDepth(12).setStrokeStyle(1,0x888800);
    this.goldText= this.add.text(GAME_WIDTH-8,15,`🪙 ${PLAYER_GOLD}`,{fontSize:'12px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,0.5).setDepth(13);

    // 키 설정
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({ W:87, A:65, S:83, D:68 });
    this.keyB   = this.input.keyboard.addKey(66);
    this.keyE   = this.input.keyboard.addKey(69);
    this.keyR   = this.input.keyboard.addKey(82);
    this.keyI   = this.input.keyboard.addKey(73);
    this.keySp  = this.input.keyboard.addKey(32);
    this.keyEsc = this.input.keyboard.addKey(27);

    // B: 건물 패널 토글 / 배치 중엔 취소
    this.keyB.on('down', () => {
      if (this.buildMode) { this._cancelBuild(); return; }
      if (!this.popupVisible && !this.inventoryUI.visible)
        this.buildPanel.visible ? this.buildPanel.setVisible(false) : this.buildPanel.setVisible(true);
    });
    // E: 배치 중엔 설치 / 아니면 상호작용
    this.keyE.on('down', () => {
      if (this.buildMode) { this._confirmPlace(); return; }
      if (this.nearbyBuilding) {
        this.nearbyBuilding.type === 'pipe'
          ? this._openPipePopup(this.nearbyBuilding.id)
          : this._openPopup(this.nearbyBuilding.id);
      }
    });
    this.keyR.on('down', () => {
      if (this.buildMode && !BUILDING_DEFS[this.buildType].isPipe) { this.ghostRot = !this.ghostRot; this._updateGhost(); }
    });
    this.keyI.on('down', () => {
      if (this.popupVisible) return; // 팝업 열려있으면 I키 무시
      this.inventoryUI.container.setPosition(this.inventoryUI.ox, this.inventoryUI.oy);
      this.inventoryUI.toggle();
    });
    this.keySp.on('down', () => { if (this.buildMode) this._confirmPlace(); });
    this.keyEsc.on('down', () => {
      if (this.inventoryUI.visible && !this.popupVisible) { this.inventoryUI.hide(); return; }
      if (this.popupVisible)        { this._closePopup(); return; }
      if (this.buildMode)           { this._cancelBuild(); return; }
      if (this.buildPanel.visible)  { this.buildPanel.setVisible(false); return; }
      this.scene.start('HubScene');
    });

    this.joystick = new VirtualJoystick(this, 80, 490);
    this.time.addEvent({ delay:1000, loop:true, callback:this._tickProduction, callbackScope:this });
    this._buildMobileButtons();
  }

  _buildMobileButtons() {
    const D = 65;
    const BW = 72, BH = 52, GAP = 8;
    const RX2 = GAME_WIDTH - GAP - BW / 2;        // 오른쪽 열 중심
    const RX1 = RX2 - BW - GAP;                   // 왼쪽 열 중심
    const RY1 = GAME_HEIGHT - GAP - BH / 2;        // 아래 행
    const RY2 = RY1 - BH - GAP;                    // 중간 행
    const RY3 = RY2 - BH - GAP;                    // 위 행

    const mkBtn = (x, y, w, h, icon, label, color, cb) => {
      const bg = this.add.rectangle(x, y, w, h, color, 0.88)
        .setDepth(D).setStrokeStyle(1, 0xffffff, 0.18).setInteractive({ useHandCursor: true });
      this.add.text(x, y - 8, icon, { fontSize: '18px' }).setOrigin(0.5).setDepth(D + 1);
      this.add.text(x, y + 14, label, { fontSize: '9px', fill: '#cccccc', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(D + 1);
      bg.on('pointerdown', cb);
      bg.on('pointerover', () => bg.setFillStyle(0x4a4a7a, 0.95));
      bg.on('pointerout', () => bg.setFillStyle(color, 0.88));
      return bg;
    };

    // 상호작용/설치 (E) - 강조 버튼
    const interactBg = this.add.rectangle(RX2, RY1, BW, BH, 0x12124a, 0.92)
      .setDepth(D).setStrokeStyle(2, 0x4466ff).setInteractive({ useHandCursor: true });
    this.add.text(RX2, RY1 - 8, '⚡', { fontSize: '18px' }).setOrigin(0.5).setDepth(D + 1);
    this.add.text(RX2, RY1 + 14, '상호작용', { fontSize: '9px', fill: '#aaaaff', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(D + 1);
    interactBg.on('pointerdown', () => {
      if (this.buildMode) { this._confirmPlace(); }
      else if (this.nearbyBuilding) {
        this.nearbyBuilding.type === 'pipe'
          ? this._openPipePopup(this.nearbyBuilding.id)
          : this._openPopup(this.nearbyBuilding.id);
      }
    });
    interactBg.on('pointerover', () => interactBg.setFillStyle(0x2a2a8a, 0.95));
    interactBg.on('pointerout', () => interactBg.setFillStyle(0x12124a, 0.92));

    // 건물 패널 (B)
    mkBtn(RX1, RY1, BW, BH, '🏗️', '건물', 0x221438, () => {
      if (this.buildMode) { this._cancelBuild(); return; }
      if (!this.popupVisible && !this.inventoryUI.visible)
        this.buildPanel.visible ? this.buildPanel.setVisible(false) : this.buildPanel.setVisible(true);
    });

    // 인벤토리 (I)
    mkBtn(RX2, RY2, BW, BH, '🎒', '인벤토리', 0x122214, () => {
      if (this.popupVisible) return;
      this.inventoryUI.container.setPosition(this.inventoryUI.ox, this.inventoryUI.oy);
      this.inventoryUI.toggle();
    });

    // 회전 (R)
    mkBtn(RX1, RY2, BW, BH, '🔄', '회전', 0x122222, () => {
      if (this.buildMode && !BUILDING_DEFS[this.buildType].isPipe) {
        this.ghostRot = !this.ghostRot;
        this._updateGhost();
      }
    });

    // 취소/뒤로 (ESC) - 양열 합쳐서 전체 너비
    mkBtn((RX1 + RX2) / 2, RY3, BW * 2 + GAP, BH, '↩️', '취소 / 뒤로', 0x2a1010, () => {
      if (this.inventoryUI.visible && !this.popupVisible) { this.inventoryUI.hide(); return; }
      if (this.popupVisible)       { this._closePopup(); return; }
      if (this.buildMode)          { this._cancelBuild(); return; }
      if (this.buildPanel.visible) { this.buildPanel.setVisible(false); return; }
      this.scene.start('HubScene');
    });
  }

  // ─────────────────────────────────────────
  // 그리드
  // ─────────────────────────────────────────
  _redrawGrid() {
    this.gridGfx.clear();
    for (let c=0; c<GRID_COLS; c++) {
      for (let r=0; r<GRID_ROWS; r++) {
        const x=GRID_OFFSET_X+c*TILE, y=GRID_OFFSET_Y+r*TILE;
        const occ=this.grid[c][r]!==null;
        this.gridGfx.fillStyle(occ?0x1a2a1a:0x0f1a0f,1).fillRect(x+1,y+1,TILE-2,TILE-2);
        this.gridGfx.lineStyle(1,occ?0x2a4a2a:0x1a2a1a,0.8).strokeRect(x,y,TILE,TILE);
      }
    }
  }

  // ─────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────
  _buildHUD() {
    this.add.rectangle(0,0,GAME_WIDTH,50,0x0a0015).setOrigin(0).setDepth(50);
    this.add.rectangle(0,49,GAME_WIDTH,2,0x2ecc71).setOrigin(0).setDepth(50);
    this.add.text(12,14,'🏗️ 기지',{fontSize:'15px',fill:'#2ecc71',fontFamily:'Arial',fontStyle:'bold'}).setDepth(50);
    this.hudStatus = this.add.text(150,14,'⚡ 에너지 확인중',{fontSize:'13px',fill:'#f1c40f',fontFamily:'Arial'}).setDepth(50);
    this.add.text(420,14,'B:건물패널  E:상호작용/설치  R:회전  I:인벤토리  ESC:취소',{fontSize:'9px',fill:'#445544',fontFamily:'Arial'}).setDepth(50);
    const backBtn=this.add.rectangle(910,25,80,30,0x2c3e50).setInteractive({useHandCursor:true}).setDepth(50);
    this.add.text(910,25,'← 마을',{fontSize:'12px',fill:'#aaaaaa',fontFamily:'Arial'}).setOrigin(0.5).setDepth(51);
    backBtn.on('pointerdown',()=>this.scene.start('HubScene'));
    this._updateHUD();
  }

  _updateHUD() {
    const estores=this.buildings.filter(b=>BUILDING_DEFS[b.type].isEnergyStorage);
    let used=0, total=0;
    estores.forEach(b=>{ total+=b.storage.slots.length; used+=b.storage.slots.filter(sl=>sl.itemId!==null).length; });
    this.hudStatus.setText(used>0?`⚡ ${used}/${total} 슬롯`:`⚡ 에너지 없음 ⚠️`).setStyle({fill:used>0?'#f1c40f':'#e74c3c'});
  }

  // ─────────────────────────────────────────
  // 건물 선택 패널
  // ─────────────────────────────────────────
  _buildBuildPanel() {
    const pw=290,ph=390,px=GAME_WIDTH/2-pw/2,py=GAME_HEIGHT/2-ph/2;
    this.buildPanel=this.add.container(0,0).setDepth(80).setVisible(false);
    this.buildPanel.add(this.add.rectangle(px,py,pw,ph,0x0a0015,0.97).setOrigin(0).setStrokeStyle(2,0x6c3483));
    this.buildPanel.add(this.add.text(px+pw/2,py+16,'🏗️ 건물 선택 (R:회전)',{fontSize:'13px',fill:'#c39bd3',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
    ['miner','lumber','refinery','estore','warehouse','bossgate','pipe','workshop'].forEach((type,i)=>{
      const def=BUILDING_DEFS[type],bx=px+16,by=py+44+i*46;
      const btn=this.add.rectangle(bx+128,by+16,250,32,0x1a0a2a).setOrigin(0.5).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x4a2c6a);
      const lbl=this.add.text(bx+10,by+16,`${def.icon} ${def.label} [${def.isPipe?'1×1':def.baseW+'×'+def.baseH}]`,{fontSize:'11px',fill:'#ffffff',fontFamily:'Arial'}).setOrigin(0,0.5);
      btn.on('pointerover',()=>btn.setFillStyle(0x2a1a4a));
      btn.on('pointerout', ()=>btn.setFillStyle(0x1a0a2a));
      btn.on('pointerdown',()=>{ this.ghostRot=false; this.buildMode=true; this.buildType=type; this.buildPanel.setVisible(false); this._showCancelBtn(); });
      this.buildPanel.add([btn,lbl]);
    });
    // 닫기
    const cb=this.add.rectangle(px+pw-16,py+16,22,22,0x3a1a2a).setInteractive({useHandCursor:true});
    this.buildPanel.add([cb,this.add.text(px+pw-16,py+16,'✕',{fontSize:'12px',fill:'#cc4444',fontFamily:'Arial'}).setOrigin(0.5)]);
    cb.on('pointerdown',()=>this.buildPanel.setVisible(false));
  }

  // ─────────────────────────────────────────
  // 팝업 컨테이너 초기화 (내용은 open시 동적 생성)
  // ─────────────────────────────────────────
  _buildPopupContainer() {
    this.popupContainer = this.add.container(0,0).setDepth(90).setVisible(false);
  }

  // 팝업 내용을 건물 타입에 맞게 동적으로 빌드
  _buildPopupContent(b) {
    const def   = BUILDING_DEFS[b.type];
    const SLOT  = 42, GAP = 3, PAD = 12;

    // 슬롯 레이아웃 계산
    const slotCount = b.storage ? b.storage.slots.length : 0;
    const slotCols  = Math.min(slotCount, 5);
    const slotRows  = slotCount > 0 ? Math.ceil(slotCount/slotCols) : 0;
    const slotAreaW = slotCols > 0 ? slotCols*(SLOT+GAP)-GAP : 0;
    const slotAreaH = slotRows > 0 ? slotRows*(SLOT+GAP)-GAP : 0;

    // 팝업 크기
    const pw = Math.max(260, slotAreaW + PAD*2);

    // 버튼 수 계산 (수동가동 또는 업그레이드 + 항상 철거)
    const hasPauseBtn = true;  // 모든 건물/파이프에 작동정지 버튼
    const hasBossEnterBtn = def.isBossGate;
    const hasCoreSlot     = !def.isPipe && !def.isWarehouse;
    const hasRunBtn   = !def.isEnergyStorage && !def.isWarehouse && !!def.resource;
    const hasUpgrBtn  = def.isEnergyStorage && !!ESTORE_UPGRADES[b.level];
    const btnAreaH    = (hasPauseBtn?34:0) + (hasRunBtn?34:0) + (hasUpgrBtn?34:0) + (hasBossEnterBtn?34:0) + (hasCoreSlot?54:0) + 34 + 8;

    const infoH   = 70;   // 헤더(36) + 정보 2줄
    const slotH   = slotAreaH > 0 ? slotAreaH + 20 : 0;  // 슬롯 + 라벨
    const ph = infoH + slotH + btnAreaH + PAD;

    // 기존 자식 제거
    this.popupChildren.forEach(o=>o.destroy());
    this.popupChildren=[]; this.popupSlotGfx=[]; this.popupSlotTxt=[];

    const reg = (obj) => { this.popupContainer.add(obj); this.popupChildren.push(obj); return obj; };

    // ── 배경 ──
    reg(this.add.rectangle(0,0,pw,ph,0x080010,0.97).setOrigin(0).setStrokeStyle(2,0x9b59b6));

    // ── 헤더 ──
    reg(this.add.text(PAD,12,`${def.icon} ${def.label}`,{fontSize:'14px',fill:'#c39bd3',fontFamily:'Arial',fontStyle:'bold'}));
    const cBtn=reg(this.add.rectangle(pw-14,14,22,22,0x2a0a1a).setOrigin(0.5).setInteractive({useHandCursor:true}));
    reg(this.add.text(pw-14,14,'✕',{fontSize:'12px',fill:'#cc4444',fontFamily:'Arial'}).setOrigin(0.5));
    cBtn.on('pointerdown',()=>this._closePopup());
    cBtn.on('pointerover', ()=>cBtn.setFillStyle(0x4a1a2a));
    cBtn.on('pointerout',  ()=>cBtn.setFillStyle(0x2a0a1a));

    // ── 구분선 ──
    reg(this.add.rectangle(0,33,pw,1,0x4a2c6a).setOrigin(0));

    // ── 정보 텍스트 2줄 ──
    this.popupInfo1 = reg(this.add.text(PAD,38,'',{fontSize:'11px',fill:'#aaaaaa',fontFamily:'Arial'}));
    this.popupInfo2 = reg(this.add.text(PAD,54,'',{fontSize:'11px',fill:'#2ecc71',fontFamily:'Arial'}));

    // ── 슬롯 그리드 ──
    if (slotCount > 0) {
      reg(this.add.text(PAD, infoH+2, '슬롯', {fontSize:'9px',fill:'#555555',fontFamily:'Arial'}));
      for (let i=0; i<slotCount; i++) {
        const sc=i%slotCols, sr=Math.floor(i/slotCols);
        const sx=PAD+sc*(SLOT+GAP), sy=infoH+16+sr*(SLOT+GAP);

        const bg=this.add.rectangle(sx,sy,SLOT,SLOT,0x180820).setOrigin(0).setStrokeStyle(1,0x3a1a5a);
        bg.setInteractive({dropZone:true, useHandCursor:true});
        bg.inv=b.storage; bg.slotIdx=i;
        bg.isEnergyStorage=def.isEnergyStorage||def.isBossGate;
        // 팝업 슬롯 클릭 이동
        const _slotIdx=i, _bStorage=b.storage, _def=def;
        bg.on('pointerdown', ()=>{
          const sel=this._invSel;
          if (!sel) {
            const slot=_bStorage.slots[_slotIdx]; if(!slot?.itemId) return;
            this._invSel={ui:null,inv:_bStorage,idx:_slotIdx,gfx:bg};
            bg.setStrokeStyle(2,0xf1c40f);
          } else {
            const prevGfx=sel.gfx; this._invSel=null;
            prevGfx?.setStrokeStyle(1,0x3a1a5a);
            const srcInv=sel.ui?sel.ui.inv:sel.inv;
            const srcSlot=srcInv.slots[sel.idx]; if(!srcSlot?.itemId) return;
            if((_def.isEnergyStorage||_def.isBossGate)&&!srcSlot.itemId.startsWith('energy_')){
              this._showHint('❌ 에너지 아이템만 넣을 수 있습니다'); return;
            }
            const amt=GLOBAL_SPLIT_MODE==='HALF'?Math.ceil(srcSlot.count/2):GLOBAL_SPLIT_MODE==='ONE'?1:srcSlot.count;
            srcInv.move(sel.idx,_bStorage,_slotIdx,amt);
            if(sel.ui) sel.ui.refresh();
            if(this.inventoryUI) this.inventoryUI.refresh();
            if(this._refreshPopupSlots) this._refreshPopupSlots();
          }
        });
        this.popupContainer.add(bg); this.popupChildren.push(bg); this.popupSlotGfx.push(bg);

        const ico=this.add.text(sx+SLOT/2,sy+SLOT/2-3,'',{fontSize:'18px',fontFamily:'Arial'}).setOrigin(0.5);
        ico.setInteractive({draggable:true});
        ico.inv=b.storage; ico.slotIdx=i;
        const cnt=this.add.text(sx+SLOT-2,sy+SLOT-2,'',{fontSize:'9px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,1);
        this.popupContainer.add(ico); this.popupChildren.push(ico);
        this.popupContainer.add(cnt); this.popupChildren.push(cnt);
        this.popupSlotTxt.push({icon:ico,count:cnt});
      }
    }

    // ── 버튼 영역 ──
    let btnY = infoH + slotH + 6;

    // 작동정지/재개 토글 버튼 (생산 건물 + 에너지저장고)
    if (true) {  // 모든 건물/파이프 작동정지 버튼
      const paused=!!b.paused;
      const pc=paused?0x1a5a1a:0x5a3a00, pa=paused?0x2ecc71:0xf1c40f;
      const pt=paused?'▶ 재개':'⏸ 작동 정지';
      const pb=reg(this.add.rectangle(PAD,btnY,pw-PAD*2,28,pc).setOrigin(0).setInteractive({useHandCursor:true}).setStrokeStyle(1,pa));
      reg(this.add.text(pw/2,btnY+14,pt,{fontSize:'12px',fill:'#'+pa.toString(16).padStart(6,'0'),fontFamily:'Arial'}).setOrigin(0.5));
      pb.on('pointerdown',()=>this._togglePause(b));
      pb.on('pointerover', ()=>pb.setFillStyle(paused?0x2a7a2a:0x7a5a00));
      pb.on('pointerout',  ()=>pb.setFillStyle(pc));
      btnY+=34;
    }

    // 수동 가동 버튼 (채굴기 등 생산 건물)
    if (!def.isEnergyStorage && !def.isWarehouse && def.resource) {
      const rb=reg(this.add.rectangle(PAD,btnY,pw-PAD*2,28,0x1a3a5a).setOrigin(0).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x3498db));
      reg(this.add.text(pw/2,btnY+14,'▶ 수동 가동 (+5)',{fontSize:'12px',fill:'#3498db',fontFamily:'Arial'}).setOrigin(0.5));
      rb.on('pointerdown',()=>this._manualRun());
      rb.on('pointerover', ()=>rb.setFillStyle(0x2a5a7a));
      rb.on('pointerout',  ()=>rb.setFillStyle(0x1a3a5a));
      btnY+=34;
    }

    // 건물 티어 업그레이드 버튼 (채굴기/벌목소)
    const hasTierUpgrade = (def.isMiner || def.isLumber) && BUILDING_UPGRADE_DEFS[b.type]?.[b.resTier||1];
    if (hasTierUpgrade) {
      const nextUp = BUILDING_UPGRADE_DEFS[b.type][b.resTier||1];
      const costStr = nextUp.costs.map(c=>`${ITEM_DEFS[c.id]?.label||c.id} ×${c.qty}`).join(', ');
      const canUp = nextUp.costs.every(c=>playerInventory.count(c.id)>=c.qty);
      const ub=reg(this.add.rectangle(PAD,btnY,pw-PAD*2,28,canUp?0x1a3a5a:0x1a1a1a).setOrigin(0).setInteractive({useHandCursor:true}).setStrokeStyle(1,canUp?0x3498db:0x333333));
      reg(this.add.text(pw/2,btnY+14,`⬆️ ${nextUp.label} (${costStr})`,{fontSize:'10px',fill:canUp?'#3498db':'#555555',fontFamily:'Arial'}).setOrigin(0.5));
      if (canUp) {
        ub.on('pointerdown',()=>this._upgradeBuildingTier());
        ub.on('pointerover', ()=>ub.setFillStyle(0x2a5a8a));
        ub.on('pointerout',  ()=>ub.setFillStyle(0x1a3a5a));
      }
      btnY+=34;
    }

    // 업그레이드 버튼 (에너지저장고)
    if (def.isEnergyStorage) {
      const next=ESTORE_UPGRADES[b.level];
      if (next) {
        const ub=reg(this.add.rectangle(PAD,btnY,pw-PAD*2,28,0x1a2a5a).setOrigin(0).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x3498db));
        reg(this.add.text(pw/2,btnY+14,`⬆️ Lv.${next.level} 업그레이드 (광물 ${next.upgradeCost})`,{fontSize:'11px',fill:'#3498db',fontFamily:'Arial'}).setOrigin(0.5));
        ub.on('pointerdown',()=>this._upgradeEstore());
        ub.on('pointerover', ()=>ub.setFillStyle(0x2a4a8a));
        ub.on('pointerout',  ()=>ub.setFillStyle(0x1a2a5a));
        btnY += 34;
      }
    }

    // 보스게이트 진입 버튼
    if (def.isBossGate) {
      const charged=b.storage.slots.reduce((s,sl)=>s+(sl.itemId?(ENERGY_ITEMS[sl.itemId]?.power||1)*sl.count:0),0);
      const cost=BOSS_GATE_COST['1-BOSS']||30;
      const ready=charged>=cost;
      const gbg=ready?0x3a0505:0x1a1a1a, gbd=ready?0xe74c3c:0x555555;
      const gb=reg(this.add.rectangle(PAD,btnY,pw-PAD*2,28,gbg).setOrigin(0).setStrokeStyle(1,gbd));
      reg(this.add.text(pw/2,btnY+14,ready?'🌀 보스전 진입!':'🔒 에너지 부족',{fontSize:'13px',fill:ready?'#e74c3c':'#555555',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
      if (ready) {
        gb.setInteractive({useHandCursor:true});
        gb.on('pointerdown',()=>this._enterBossFight(b));
        gb.on('pointerover',()=>gb.setFillStyle(0x5a0808));
        gb.on('pointerout', ()=>gb.setFillStyle(gbg));
      }
      btnY+=34;
    }

    // 코어 장착 슬롯
    if (hasCoreSlot) {
      reg(this.add.text(PAD,btnY+8,'🔩 코어:',{fontSize:'10px',fill:'#888888',fontFamily:'Arial'}).setOrigin(0,0.5));
      const effEq=!!b.cores?.efficiency, redEq=!!b.cores?.reduce;
      const hasEff=playerInventory.count('core_efficiency')>0, hasRed=playerInventory.count('core_reduce')>0;
      const ec=this.add.rectangle(PAD+56,btnY,44,30,effEq?0x2a1800:0x181818).setOrigin(0).setStrokeStyle(2,effEq?0xf39c12:0x444444).setInteractive({useHandCursor:true});
      const et=this.add.text(PAD+56+22,btnY+11,effEq?'🟡✓':'🟡',{fontSize:'14px'}).setOrigin(0.5);
      const el=this.add.text(PAD+56+22,btnY+25,effEq?'효율ON':hasEff?'효율':'없음',{fontSize:'7px',fill:effEq?'#f39c12':hasEff?'#665533':'#333333',fontFamily:'Arial'}).setOrigin(0.5);
      const rc=this.add.rectangle(PAD+106,btnY,44,30,redEq?0x001828:0x181818).setOrigin(0).setStrokeStyle(2,redEq?0x2980b9:0x444444).setInteractive({useHandCursor:true});
      const rt=this.add.text(PAD+106+22,btnY+11,redEq?'🔵✓':'🔵',{fontSize:'14px'}).setOrigin(0.5);
      const rl=this.add.text(PAD+106+22,btnY+25,redEq?'절약ON':hasRed?'절약':'없음',{fontSize:'7px',fill:redEq?'#2980b9':hasRed?'#335566':'#333333',fontFamily:'Arial'}).setOrigin(0.5);
      reg(ec); reg(et); reg(el); reg(rc); reg(rt); reg(rl);
      ec.on('pointerdown',()=>this._toggleCore(b,'efficiency'));
      rc.on('pointerdown',()=>this._toggleCore(b,'reduce'));
      btnY+=54;
    }

    // 철거 버튼 (항상)
    const db=reg(this.add.rectangle(PAD,btnY,pw-PAD*2,28,0x5a1a1a).setOrigin(0).setInteractive({useHandCursor:true}).setStrokeStyle(1,0xe74c3c));
    reg(this.add.text(pw/2,btnY+14,'🗑 철거',{fontSize:'12px',fill:'#e74c3c',fontFamily:'Arial'}).setOrigin(0.5));
    db.on('pointerdown',()=>this._demolishBuilding());
    db.on('pointerover', ()=>db.setFillStyle(0x8a2a2a));
    db.on('pointerout',  ()=>db.setFillStyle(0x5a1a1a));

    return { pw, ph };
  }

  // ─────────────────────────────────────────
  // 팝업 열기/닫기
  // ─────────────────────────────────────────
  _openPopup(id) {
    if (this.buildMode) return;
    const b=this.buildings.find(b=>b.id===id); if (!b) return;
    // 제작소/대장간은 씬 전환으로 처리
    if (b.type==='workshop') { this.scene.start('CraftScene'); return; }
    if (b.type==='smithy')   { this.scene.start('SmithScene'); return; }
    this.activeBuilding=b;
    const def=BUILDING_DEFS[b.type];

    const {pw,ph}=this._buildPopupContent(b);

    // 정보 텍스트
    const stateTag=b.paused?'  ⏸ 정지 중':'';
    if (def.isBossGate) {
      // 보스게이트 — 충전 현황
      const charged=b.storage.slots.reduce((sum,sl)=>{
        if (!sl.itemId) return sum;
        const power=ENERGY_ITEMS[sl.itemId]?.power||1;
        return sum+sl.count*power;
      },0);
      const cost=BOSS_GATE_COST['1-BOSS']||30;
      this.popupInfo1.setText(`충전량: ${charged} / ${cost}  (에너지 단위)`);
      this.popupInfo2.setText(charged>=cost?'🌀 보스전 진입 가능!':'⚡ 에너지를 슬롯에 드래그해서 충전하세요.');
    } else if (def.isEnergyStorage) {
      const lv=ESTORE_UPGRADES[b.level-1];
      this.popupInfo1.setText(`레벨: ${lv.label}  |  슬롯 용량: ${lv.slotSize}개${stateTag}`);
      this.popupInfo2.setText('인벤토리에서 에너지 아이템을 슬롯으로 드래그하세요.');
    } else if (def.isWarehouse) {
      const used=b.storage.slots.filter(s=>s.itemId).length;
      this.popupInfo1.setText(`슬롯 사용: ${used}/${b.storage.slots.length}`);
      this.popupInfo2.setText('파이프 연결된 건물의 자원이 자동 이송됩니다.');
    } else {
      const wh=this._findConnectedWarehouse(b);
      const estore=this._findConnectedEstore(b);
      const stored=b.storage?.slots[0]?.count||0;
      const connState=b.paused?'⏸ 정지':estore?'🟢 가동 중':'🔴 에너지저장고 미연결';
      const def2=BUILDING_DEFS[b.type];
      if (def2.isMiner||def2.isLumber) {
        const resId=this._getBuildingResource(b);
        const resDef=ITEM_DEFS[resId];
        this.popupInfo1.setText(`[Tier ${b.resTier||1}] ${resDef?.icon||''} ${resDef?.label||resId} 생산 | ${connState}`);
        this.popupInfo2.setText(wh?(wh.paused?'📦 창고 정지 → 내부 보관':'📦 창고 연결됨'):'📦 창고 미연결 → 내부 보관');
      } else {
        this.popupInfo1.setText(`보관: ${stored}  |  ${connState}`);
        this.popupInfo2.setText(wh?(wh.paused?'📦 창고 정지 → 내부 보관':'📦 창고 연결됨'):'📦 창고 미연결 → 내부 보관');
      }
    }

    // 팝업 위치: 좌측, 세로 중앙
    const px=16;
    const py=Math.max(55, Math.min(GAME_HEIGHT-ph-10, (GAME_HEIGHT-ph)/2));
    this.popupContainer.setPosition(px,py).setVisible(true);
    this.popupVisible=true;

    // 슬롯 렌더
    this._refreshPopupSlots();

    // 인벤토리를 팝업 오른쪽에 배치
    this.inventoryUI.container.setPosition(px+pw+10, py);
    this.inventoryUI.show();
  }

  _openPipePopup(id) {
    if (this.buildMode) return;
    const p=this.pipes.find(p=>p.id===id); if (!p) return;
    this.activeBuilding={...p,type:'pipe',w:1,h:1};
    const {pw,ph}=this._buildPipePopupContent(p);
    this.popupContainer.setPosition(16,(GAME_HEIGHT-ph)/2).setVisible(true);
    this.popupVisible=true;
  }

  // 파이프 전용 팝업 (작동정지 포함)
  _buildPipePopupContent(p) {
    this.popupChildren.forEach(o=>o.destroy());
    this.popupChildren=[]; this.popupSlotGfx=[]; this.popupSlotTxt=[];

    const paused=!!p.paused;
    const pw=240, ph=140;
    const reg=(obj)=>{ this.popupContainer.add(obj); this.popupChildren.push(obj); return obj; };

    reg(this.add.rectangle(0,0,pw,ph,0x080010,0.97).setOrigin(0).setStrokeStyle(2,0x4adc9a));
    reg(this.add.text(12,12,'🔗 파이프',{fontSize:'14px',fill:'#4adc9a',fontFamily:'Arial',fontStyle:'bold'}));
    const cb=reg(this.add.rectangle(pw-14,14,22,22,0x2a0a1a).setOrigin(0.5).setInteractive({useHandCursor:true}));
    reg(this.add.text(pw-14,14,'✕',{fontSize:'12px',fill:'#cc4444',fontFamily:'Arial'}).setOrigin(0.5));
    cb.on('pointerdown',()=>this._closePopup());
    reg(this.add.rectangle(0,33,pw,1,0x2adc6a).setOrigin(0));
    reg(this.add.text(12,40,'에너지를 소모하여 자원을 이송합니다.',{fontSize:'11px',fill:'#aaaaaa',fontFamily:'Arial'}));
    reg(this.add.text(12,57,`파이프 ${this.pipes.length}개  |  소모 ${this._calcPipeEnergyCost()}/초  |  ${paused?'⏸ 정지':'🟢 활성'}`,{fontSize:'11px',fill:'#f1c40f',fontFamily:'Arial'}));

    // 작동정지/재개 버튼
    const pc=paused?0x1a5a1a:0x5a3a00, pa=paused?0x2ecc71:0xf1c40f;
    const pb2=reg(this.add.rectangle(12,74,pw-24,26,pc).setOrigin(0).setInteractive({useHandCursor:true}).setStrokeStyle(1,pa));
    reg(this.add.text(pw/2,87,paused?'▶ 재개':'⏸ 작동 정지',{fontSize:'12px',fill:'#'+pa.toString(16).padStart(6,'0'),fontFamily:'Arial'}).setOrigin(0.5));
    pb2.on('pointerdown',()=>this._togglePausePipe(p));
    pb2.on('pointerover', ()=>pb2.setFillStyle(paused?0x2a7a2a:0x7a5a00));
    pb2.on('pointerout',  ()=>pb2.setFillStyle(pc));

    // 철거 버튼
    const db2=reg(this.add.rectangle(12,108,pw-24,26,0x5a1a1a).setOrigin(0).setInteractive({useHandCursor:true}).setStrokeStyle(1,0xe74c3c));
    reg(this.add.text(pw/2,121,'🗑 철거',{fontSize:'11px',fill:'#e74c3c',fontFamily:'Arial'}).setOrigin(0.5));
    db2.on('pointerdown',()=>this._demolishBuilding());
    db2.on('pointerover', ()=>db2.setFillStyle(0x8a2a2a));
    db2.on('pointerout',  ()=>db2.setFillStyle(0x5a1a1a));

    return {pw,ph};
  }

  _toggleCore(b, coreType) {
    if (!b.cores) b.cores={};
    const itemId=coreType==='efficiency'?'core_efficiency':'core_reduce';
    if (b.cores[coreType]) {
      b.cores[coreType]=false; playerInventory.add(itemId,1);
      this._showHint((coreType==='efficiency'?'🟡':'🔵')+' 코어 해제 → 인벤토리 반환');
    } else {
      if (!playerInventory.count(itemId)) { this._showHint('❌ 코어 없음'); return; }
      playerInventory.consume(itemId,1); b.cores[coreType]=true;
      this._showHint((coreType==='efficiency'?'🟡 효율':'🔵 절약')+' 코어 장착!');
    }
    if (this.inventoryUI?.visible) this.inventoryUI.refresh();
    this._openPopup(b.id);
  }

  _enterBossFight(b) {
    // 게이트 에너지 소모
    b.storage.slots.forEach(sl=>{ sl.itemId=null; sl.count=0; });
    this._closePopup();
    // 보스 스테이지로 진입
    if (!window.FIELD_DATA) window.FIELD_DATA={cleared:new Set()};
    FIELD_DATA.currentStage='1-BOSS';
    PLAYER_STATS.hp=PLAYER_STATS.maxHp;
    this.cameras.main.fadeOut(400,60,0,0);
    this.cameras.main.once('camerafadeoutcomplete',()=>{
      this.scene.start('FieldScene');
    });
  }

  _closePopup() {
    this.popupContainer.setVisible(false);
    this.popupVisible=false;
    this.activeBuilding=null;
    this.inventoryUI.hide();
    this.inventoryUI.container.setPosition(this.inventoryUI.ox, this.inventoryUI.oy);
  }

  _refreshPopupSlots() {
    if (!this.activeBuilding?.storage) return;
    const slots=this.activeBuilding.storage.slots;
    for (let i=0; i<this.popupSlotTxt.length; i++) {
      const sl=slots[i], {icon,count}=this.popupSlotTxt[i];
      if (sl?.itemId) {
        const d=ITEM_DEFS[sl.itemId];
        icon.setText(d?d.icon:'?');
        count.setText(String(sl.count));
        this.popupSlotGfx[i].setFillStyle(d?d.bg:0x180820);
      } else {
        icon.setText(''); count.setText('');
        this.popupSlotGfx[i].setFillStyle(0x180820);
      }
    }
  }

  // ─────────────────────────────────────────
  // 취소 버튼 (배치 모드 중)
  // ─────────────────────────────────────────
  _showCancelBtn() {
    if (!this.cancelBtn) {
      this.cancelBtn=this.add.rectangle(GAME_WIDTH/2+100,GAME_HEIGHT-26,130,26,0x5a1a1a).setInteractive({useHandCursor:true}).setDepth(61).setStrokeStyle(1,0xe74c3c);
      this.cancelLbl=this.add.text(GAME_WIDTH/2+100,GAME_HEIGHT-26,'✕ 취소 (B / ESC)',{fontSize:'11px',fill:'#e74c3c',fontFamily:'Arial'}).setOrigin(0.5).setDepth(62);
      this.cancelBtn.on('pointerdown',()=>this._cancelBuild());
      this.cancelBtn.on('pointerover', ()=>this.cancelBtn.setFillStyle(0x8a2a2a));
      this.cancelBtn.on('pointerout',  ()=>this.cancelBtn.setFillStyle(0x5a1a1a));
    }
    const def=BUILDING_DEFS[this.buildType];
    if (!this.hintText) this.hintText=this.add.text(GAME_WIDTH/2-40,GAME_HEIGHT-26,'',{
      fontSize:'11px',fill:'#ffffff',fontFamily:'Arial',backgroundColor:'#00000099',padding:{x:6,y:3}
    }).setOrigin(0.5).setDepth(60);
    this.hintText.setText(`${def.icon} ${def.label} 배치 중 — E/Space:설치  R:회전`).setVisible(true);
    this.cancelBtn.setVisible(true); this.cancelLbl.setVisible(true);
  }

  _showHint(msg) {
    if (!this.hintText) this.hintText=this.add.text(GAME_WIDTH/2,GAME_HEIGHT-26,'',{
      fontSize:'11px',fill:'#ffffff',fontFamily:'Arial',backgroundColor:'#00000099',padding:{x:6,y:3}
    }).setOrigin(0.5).setDepth(60);
    this.hintText.setText(msg).setVisible(true);
    this.time.delayedCall(2200,()=>{ if (this.hintText&&!this.buildMode) this.hintText.setVisible(false); });
  }

  // ─────────────────────────────────────────
  // 건물 배치
  // ─────────────────────────────────────────
  _updateGhost() {
    if (!this.buildMode) return;
    const def=BUILDING_DEFS[this.buildType];
    const w=def.isPipe?1:(this.ghostRot?def.baseH:def.baseW);
    const h=def.isPipe?1:(this.ghostRot?def.baseW:def.baseH);
    const mx=this.input.activePointer.x, my=this.input.activePointer.y;
    let gc=Math.floor((mx-GRID_OFFSET_X)/TILE), gr=Math.floor((my-GRID_OFFSET_Y)/TILE);
    this.ghostCol=Phaser.Math.Clamp(gc,0,GRID_COLS-w);
    this.ghostRow=Phaser.Math.Clamp(gr,0,GRID_ROWS-h);

    while (this.ghostTiles.length<w*h) this.ghostTiles.push(this.add.rectangle(0,0,TILE-2,TILE-2,0x2ecc71,0.4).setDepth(30));
    while (this.ghostTiles.length>w*h) this.ghostTiles.pop().destroy();

    let valid=true;
    for (let dc=0;dc<w;dc++) for (let dr=0;dr<h;dr++)
      if (this.grid[this.ghostCol+dc]?.[this.ghostRow+dr]!==null) valid=false;
    // 캐릭터 거리 체크
    const gCX=GRID_OFFSET_X+(this.ghostCol+w/2)*TILE, gCY=GRID_OFFSET_Y+(this.ghostRow+h/2)*TILE;
    if (Phaser.Math.Distance.Between(this.px,this.py,gCX,gCY)>TILE*(def.isPipe?4:5)) valid=false;

    let i=0;
    for (let dc=0;dc<w;dc++) for (let dr=0;dr<h;dr++) {
      this.ghostTiles[i].setPosition(GRID_OFFSET_X+(this.ghostCol+dc)*TILE+TILE/2,GRID_OFFSET_Y+(this.ghostRow+dr)*TILE+TILE/2)
        .setVisible(true).setFillStyle(valid?0x2ecc71:0xe74c3c,0.4);
      i++;
    }
  }

  _cancelBuild() {
    this.buildMode=false; this.buildType=null;
    this.ghostTiles.forEach(t=>t.destroy()); this.ghostTiles=[];
    if (this.cancelBtn) this.cancelBtn.setVisible(false);
    if (this.cancelLbl) this.cancelLbl.setVisible(false);
    if (this.hintText)  this.hintText.setVisible(false);
  }

  _confirmPlace() {
    const type=this.buildType, def=BUILDING_DEFS[type];
    const w=def.isPipe?1:(this.ghostRot?def.baseH:def.baseW);
    const h=def.isPipe?1:(this.ghostRot?def.baseW:def.baseH);
    const col=this.ghostCol, row=this.ghostRow;

    for (let dc=0;dc<w;dc++) for (let dr=0;dr<h;dr++)
      if (this.grid[col+dc]?.[row+dr]!==null) { this._showHint('❌ 배치 불가!'); return; }

    const gCX=GRID_OFFSET_X+(col+w/2)*TILE, gCY=GRID_OFFSET_Y+(row+h/2)*TILE;
    if (Phaser.Math.Distance.Between(this.px,this.py,gCX,gCY)>TILE*(def.isPipe?4:5)) { this._showHint('❌ 캐릭터 근처에서만!'); return; }

    const id=Date.now()+Math.random();
    for (let dc=0;dc<w;dc++) for (let dr=0;dr<h;dr++) this.grid[col+dc][row+dr]={type,id};

    if (def.isPipe) {
      const pg=this.add.graphics().setDepth(9);
      pg.fillStyle(0x1a3a2a,1).fillRect(GRID_OFFSET_X+col*TILE+4,GRID_OFFSET_Y+row*TILE+4,TILE-8,TILE-8);
      this.pipes.push({id,col,row,gfx:pg});
      this._redrawPipeLines();
      // 파이프는 연속 배치 (건물 패널 안 닫음)
      this._showHint(`🔗 파이프 ${this.pipes.length}개 설치 | E:계속 배치`);
    } else {
      const bx=GRID_OFFSET_X+col*TILE, by=GRID_OFFSET_Y+row*TILE;
      const bg2=this.add.rectangle(bx,by,w*TILE,h*TILE,def.color).setOrigin(0).setDepth(10).setStrokeStyle(2,0x9b59b6);
      const ico=this.add.text(bx+w*TILE/2,by+h*TILE/2-8,def.icon,{fontSize:'20px'}).setOrigin(0.5).setDepth(11);
      const lbl=this.add.text(bx+w*TILE/2,by+h*TILE/2+10,def.label,{fontSize:'10px',fill:'#ffffff',fontFamily:'Arial'}).setOrigin(0.5).setDepth(11);

      let storage=null;
      if (def.isWarehouse)          storage=new ItemStorage(def.label,30);
      else if (def.isEnergyStorage) storage=new ItemStorage('에너지저장고',ESTORE_UPGRADES[0].slots,ESTORE_UPGRADES[0].slotSize);
      else if (def.isBossGate)      storage=new ItemStorage('보스 게이트',5,999);
      else if (def.resource)        storage=new ItemStorage('채굴기 내부',1,100);

      const resTier = (def.isMiner||def.isLumber) ? 1 : undefined;
      this.buildings.push({id,type,col,row,w,h,gfx:[bg2,ico,lbl],level:1,storage,resTier});
      this._cancelBuild(); this._redrawGrid();
      this._showHint(`✅ ${def.label} 설치 완료!`);
    }
    this._updateHUD();
  }

  // ─────────────────────────────────────────
  // 작동 정지 / 재개 토글
  // ─────────────────────────────────────────
  _togglePause(b) {
    b.paused = !b.paused;
    if (b.pauseOverlay)  { b.pauseOverlay.destroy();  b.pauseOverlay=null; }
    if (b.pauseOverlay2) { b.pauseOverlay2.destroy(); b.pauseOverlay2=null; }
    if (b.paused) {
      const bx=GRID_OFFSET_X+b.col*TILE, by=GRID_OFFSET_Y+b.row*TILE;
      b.pauseOverlay  = this.add.rectangle(bx,by,b.w*TILE,b.h*TILE,0x000000,0.5).setOrigin(0).setDepth(12);
      b.pauseOverlay2 = this.add.text(bx+b.w*TILE/2,by+b.h*TILE/2,'⏸',{fontSize:'20px'}).setOrigin(0.5).setDepth(13);
      this._showHint(`⏸ ${BUILDING_DEFS[b.type].label} 작동 정지`);
    } else {
      this._showHint(`▶ ${BUILDING_DEFS[b.type].label} 작동 재개`);
    }
    this._openPopup(b.id);
  }

  _togglePausePipe(p) {
    // pipes 배열에서 실제 객체 찾아서 paused 토글
    const realPipe = this.pipes.find(pp=>pp.id===p.id);
    if (!realPipe) return;
    realPipe.paused = !realPipe.paused;
    // 파이프 그래픽 색상으로 정지 표시
    realPipe.gfx.clear();
    const col = realPipe.paused ? 0x3a1a1a : 0x1a3a2a;
    const brd = realPipe.paused ? 0xe74c3c : 0x4adc9a;
    realPipe.gfx.fillStyle(col,1).fillRect(GRID_OFFSET_X+realPipe.col*TILE+4,GRID_OFFSET_Y+realPipe.row*TILE+4,TILE-8,TILE-8);
    realPipe.gfx.lineStyle(1,brd,1).strokeRect(GRID_OFFSET_X+realPipe.col*TILE+4,GRID_OFFSET_Y+realPipe.row*TILE+4,TILE-8,TILE-8);
    this.activeBuilding={...realPipe,type:'pipe',w:1,h:1};
    this._showHint(realPipe.paused?'⏸ 파이프 정지':'▶ 파이프 재개');
    // 팝업 재빌드
    const {pw,ph}=this._buildPipePopupContent(realPipe);
    this.popupContainer.setPosition(16,(GAME_HEIGHT-ph)/2);
  }

  _restorePauseOverlays() {
    this.buildings.forEach(b=>{
      if (!b.paused) return;
      const bx=GRID_OFFSET_X+b.col*TILE, by=GRID_OFFSET_Y+b.row*TILE;
      b.pauseOverlay  = this.add.rectangle(bx,by,b.w*TILE,b.h*TILE,0x000000,0.5).setOrigin(0).setDepth(12);
      b.pauseOverlay2 = this.add.text(bx+b.w*TILE/2,by+b.h*TILE/2,'⏸',{fontSize:'20px'}).setOrigin(0.5).setDepth(13);
    });
    // 정지된 파이프 색상 복원
    this.pipes.forEach(p=>{
      if (!p.paused) return;
      p.gfx.clear();
      p.gfx.fillStyle(0x3a1a1a,1).fillRect(GRID_OFFSET_X+p.col*TILE+4,GRID_OFFSET_Y+p.row*TILE+4,TILE-8,TILE-8);
      p.gfx.lineStyle(1,0xe74c3c,1).strokeRect(GRID_OFFSET_X+p.col*TILE+4,GRID_OFFSET_Y+p.row*TILE+4,TILE-8,TILE-8);
    });
  }

  // ─────────────────────────────────────────
  // 수동 가동
  // ─────────────────────────────────────────
  _manualRun() {
    if (!this.activeBuilding||this.activeBuilding.type==='pipe') return;
    const b=this.activeBuilding, def=BUILDING_DEFS[b.type];
    const def2=BUILDING_DEFS[b.type];
    if (def2.rate>0) {
      const resId = this._getBuildingResource(b);
      const resDef= ITEM_DEFS[resId];
      const wh=this._findConnectedWarehouse(b);
      const hasEnergy=this._totalEnergy()>0;
      if (wh?.storage&&hasEnergy) {
        wh.storage.add(resId,5);
        this._showHint(`${resDef?.icon||'⛏️'} +5 ${resDef?.label||resId} → 📦 창고 이송!`);
      } else {
        if (b.storage) b.storage.add(resId,5);
        else playerInventory.add(resId,5);
        this._showHint(`${resDef?.icon||'⛏️'} +5 ${resDef?.label||resId} → 내부 보관`);
      }
      this._refreshPopupSlots();
      const stored=b.storage?.slots[0]?.count||0;
      if (this.popupInfo1) this.popupInfo1.setText(`보관 자원: ${stored} ${resDef?.label||resId}`);
    }
  }

  // ─────────────────────────────────────────
  // 건물 티어 업그레이드 (채굴기/벌목소)
  // ─────────────────────────────────────────
  _upgradeBuildingTier() {
    const b = this.activeBuilding; if (!b) return;
    const upgrades = BUILDING_UPGRADE_DEFS[b.type];
    if (!upgrades) return;
    const tier = b.resTier || 1;
    const next = upgrades[tier];
    if (!next) { this._showHint('최고 티어입니다!'); return; }
    // 재료 확인
    for (const c of next.costs) {
      if (playerInventory.count(c.id) < c.qty) {
        const d = ITEM_DEFS[c.id];
        this._showHint(`❌ ${d?.label||c.id} ${c.qty}개 필요`); return;
      }
    }
    next.costs.forEach(c => playerInventory.consume(c.id, c.qty));
    b.resTier = tier + 1;
    const resId = this._getBuildingResource(b);
    const resDef = ITEM_DEFS[resId];
    this._showHint(`⬆️ Tier ${b.resTier} 업그레이드! 이제 ${resDef?.label||resId} 생산`);
    // 건물 레이블 갱신
    if (b.gfx && b.gfx[2]) b.gfx[2].setText(`${BUILDING_DEFS[b.type].label} T${b.resTier}`);
    this._openPopup(b.id);
  }

  // ─────────────────────────────────────────
  // 에너지저장고 업그레이드
  // ─────────────────────────────────────────
  _upgradeEstore() {
    if (!this.activeBuilding||this.activeBuilding.type==='pipe') return;
    const b=this.activeBuilding, next=ESTORE_UPGRADES[b.level];
    if (!next) return;
    if (playerInventory.count('mineral')<next.upgradeCost) { this._showHint(`❌ 광물 ${next.upgradeCost}개 필요`); return; }
    playerInventory.consume('mineral',next.upgradeCost);
    b.level++;
    b.storage.maxStack=ESTORE_UPGRADES[b.level-1].slotSize;
    while (b.storage.slots.length<ESTORE_UPGRADES[b.level-1].slots) b.storage.slots.push({itemId:null,count:0});
    this._updateHUD();
    this._openPopup(b.id); // 팝업 재빌드
  }

  // ─────────────────────────────────────────
  // 철거
  // ─────────────────────────────────────────
  _demolishBuilding() {
    if (!this.activeBuilding) return;
    const b=this.activeBuilding;
    if (b.type==='pipe') {
      this.grid[b.col][b.row]=null;
      b.gfx?.destroy();
      this.pipes=this.pipes.filter(x=>x.id!==b.id);
    } else {
      for (let dc=0;dc<b.w;dc++) for (let dr=0;dr<b.h;dr++) this.grid[b.col+dc][b.row+dr]=null;
      b.gfx.forEach(g=>g.destroy());
      if (b.pauseOverlay)  b.pauseOverlay.destroy();
      if (b.pauseOverlay2) b.pauseOverlay2.destroy();
      this.buildings=this.buildings.filter(x=>x.id!==b.id);
    }
    this._redrawGrid(); this._redrawPipeLines(); this._closePopup(); this._updateHUD();
  }

  // ─────────────────────────────────────────
  // 파이프
  // ─────────────────────────────────────────
  _calcPipeEnergyCost() { return Math.floor(this.pipes.length/20); }

  _redrawPipeLines() {
    this.pipeLineGfx.clear();
    this.pipes.forEach(p=>{
      const cx=GRID_OFFSET_X+p.col*TILE+TILE/2, cy=GRID_OFFSET_Y+p.row*TILE+TILE/2;
      [{dc:1,dr:0},{dc:-1,dr:0},{dc:0,dr:1},{dc:0,dr:-1}].forEach(({dc,dr})=>{
        const nc=p.col+dc, nr=p.row+dr;
        if (nc<0||nr<0||nc>=GRID_COLS||nr>=GRID_ROWS) return;
        const cell=this.grid[nc][nr]; if (!cell) return;
        if (BUILDING_DEFS[cell.type]?.isPipe) {
          const np=this.pipes.find(pp=>pp.id===cell.id);
          if (!np||np.id<p.id) return;
          this.pipeLineGfx.lineStyle(3,0x4adc9a,0.8).beginPath()
            .moveTo(cx,cy).lineTo(GRID_OFFSET_X+np.col*TILE+TILE/2,GRID_OFFSET_Y+np.row*TILE+TILE/2).strokePath();
        }
      });
    });
  }

  _findConnectedWarehouse(bld) {
    const starts=new Set();
    for (let dc=-1;dc<=bld.w;dc++) for (let dr=-1;dr<=bld.h;dr++) {
      if (dc>=0&&dc<bld.w&&dr>=0&&dr<bld.h) continue;
      const nc=bld.col+dc, nr=bld.row+dr;
      if (nc<0||nr<0||nc>=GRID_COLS||nr>=GRID_ROWS) continue;
      const cell=this.grid[nc][nr];
      if (cell&&BUILDING_DEFS[cell.type]?.isPipe) starts.add(`${nc},${nr}`);
    }
    if (starts.size===0) return null;

    const visited=new Set(), queue=[...starts];
    while (queue.length) {
      const key=queue.shift(); if (visited.has(key)) continue; visited.add(key);
      const [c,r]=key.split(',').map(Number);
      for (const {dc,dr} of [{dc:1,dr:0},{dc:-1,dr:0},{dc:0,dr:1},{dc:0,dr:-1}]) {
        const nc=c+dc, nr=r+dr;
        if (nc<0||nr<0||nc>=GRID_COLS||nr>=GRID_ROWS) continue;
        const cell=this.grid[nc][nr]; if (!cell) continue;
        if (BUILDING_DEFS[cell.type]?.isPipe&&!visited.has(`${nc},${nr}`)) {
          const pp=this.pipes.find(p=>p.col===nc&&p.row===nr);
          if (!pp?.paused) queue.push(`${nc},${nr}`);
        } else if (BUILDING_DEFS[cell.type]?.isWarehouse) return this.buildings.find(b=>b.id===cell.id)||null;
      }
    }
    return null;
  }

  // BFS: 건물 → 파이프 → 에너지저장고 연결 확인
  _findConnectedEstore(bld) {
    const starts = new Set();
    for (let dc=-1; dc<=bld.w; dc++) for (let dr=-1; dr<=bld.h; dr++) {
      if (dc>=0&&dc<bld.w&&dr>=0&&dr<bld.h) continue;
      const nc=bld.col+dc, nr=bld.row+dr;
      if (nc<0||nr<0||nc>=GRID_COLS||nr>=GRID_ROWS) continue;
      const cell=this.grid[nc][nr];
      if (cell&&BUILDING_DEFS[cell.type]?.isPipe) starts.add(`${nc},${nr}`);
    }
    if (starts.size===0) return null;
    const visited=new Set(), queue=[...starts];
    while (queue.length) {
      const key=queue.shift(); if (visited.has(key)) continue; visited.add(key);
      const [c,r]=key.split(',').map(Number);
      for (const {dc,dr} of [{dc:1,dr:0},{dc:-1,dr:0},{dc:0,dr:1},{dc:0,dr:-1}]) {
        const nc=c+dc, nr=r+dr;
        if (nc<0||nr<0||nc>=GRID_COLS||nr>=GRID_ROWS) continue;
        const cell=this.grid[nc][nr]; if (!cell) continue;
        if (BUILDING_DEFS[cell.type]?.isPipe&&!visited.has(`${nc},${nr}`)) {
          // 정지된 파이프는 경로 차단
          const pp=this.pipes.find(p=>p.col===nc&&p.row===nr);
          if (!pp?.paused) queue.push(`${nc},${nr}`);
        } else if (BUILDING_DEFS[cell.type]?.isEnergyStorage) {
          const es=this.buildings.find(b=>b.id===cell.id);
          if (es&&!es.paused&&es.storage.slots.some(sl=>sl.itemId&&sl.count>0)) return es;
        }
      }
    }
    return null;
  }

  _consumeEstoreEnergy(estore, amount) {
    let rem=amount;
    for (const sl of estore.storage.slots) {
      if (!sl.itemId||sl.count<=0||rem<=0) continue;
      const power=ENERGY_ITEMS[sl.itemId]?.power||1;
      const used=Math.min(sl.count,Math.ceil(rem/power));
      sl.count-=used; rem-=used*power;
      if (sl.count<=0){sl.itemId=null;sl.count=0;}
    }
    return rem<=0;
  }

  // ─────────────────────────────────────────
  // 에너지
  // ─────────────────────────────────────────
  _totalEnergy() {
    let e=0;
    this.buildings.filter(b=>BUILDING_DEFS[b.type].isEnergyStorage).forEach(b=>{
      b.storage.slots.forEach(sl=>{ if (sl.itemId) e+=(ENERGY_ITEMS[sl.itemId]?.power||0)*sl.count; });
    });
    return e;
  }

  _consumeEnergy(amount) {
    let rem=amount;
    for (const b of this.buildings.filter(b=>BUILDING_DEFS[b.type].isEnergyStorage)) {
      for (const sl of b.storage.slots) {
        if (!sl.itemId||sl.count<=0||rem<=0) continue;
        const power=ENERGY_ITEMS[sl.itemId]?.power||1;
        const used=Math.min(sl.count,Math.ceil(rem/power));
        sl.count-=used; rem-=used*power;
        if (sl.count<=0) { sl.itemId=null; sl.count=0; }
      }
    }
    return rem<=0;
  }

  // ─────────────────────────────────────────
  // 자동 생산 (1초 타이머)
  // ─────────────────────────────────────────
  // 건물 티어에 맞는 생산 자원 반환
  _getBuildingResource(b) {
    const def = BUILDING_DEFS[b.type];
    const tier = (b.resTier || 1) - 1;
    if (def.isMiner)  return MINERAL_TIERS[Math.min(tier, MINERAL_TIERS.length-1)];
    if (def.isLumber) return WOOD_TIERS[Math.min(tier, WOOD_TIERS.length-1)];
    return def.resource || 'copper';
  }

  _tickProduction() {
    let anyProduced=false;
    this.buildings.forEach(b=>{
      const def=BUILDING_DEFS[b.type];
      if (def.rate<=0||b.paused) return;       // 정지 또는 비생산 건물

      const estore=this._findConnectedEstore(b);
      if (!estore) return;

      const wh=this._findConnectedWarehouse(b);
      const whActive = wh && !wh.paused;

      // 에너지 소모: 티어 × 1 + 파이프비례 + 창고연결+1
      const tier = b.resTier || 1;
      let cost = tier + this._calcPipeEnergyCost() + (whActive ? 1 : 0);
      if (b.cores?.reduce) cost = Math.max(1, Math.floor(cost * 0.75));
      if (!this._consumeEstoreEnergy(estore, cost)) return;

      const resId = this._getBuildingResource(b);
      const rate  = b.cores?.efficiency ? Math.ceil(def.rate*1.2) : def.rate;
      if (whActive) wh.storage.add(resId, rate);
      else if (b.storage) b.storage.add(resId, rate);
      anyProduced=true;
    });
    this._updateHUD();
    if (anyProduced) {
      if (this.inventoryUI?.visible) this.inventoryUI.refresh();
      this._refreshPopupSlots();
    }
  }

  // ─────────────────────────────────────────
  // update
  // ─────────────────────────────────────────
  update(t,delta) {
    this.joystick.update(this);
    if (this.goldText) this.goldText.setText(`🪙 ${PLAYER_GOLD}`);
    if (this.popupVisible||this.inventoryUI.visible) {
      // UI 열려있어도 조이스틱 입력은 처리하되 이동 차단
      if (this.buildMode) this._updateGhost(); return;
    }

    let vx=0,vy=0;
    if (this.wasd.A.isDown||this.cursors.left.isDown)  { vx=-this.speed; this.facing='left'; }
    if (this.wasd.D.isDown||this.cursors.right.isDown) { vx= this.speed; this.facing='right'; }
    if (this.wasd.W.isDown||this.cursors.up.isDown)    { vy=-this.speed; this.facing='up'; }
    if (this.wasd.S.isDown||this.cursors.down.isDown)  { vy= this.speed; this.facing='down'; }
    if (this.joystick.active) { vx=this.joystick.vx*this.speed; vy=this.joystick.vy*this.speed; }
    if (vx!==0&&vy!==0) { vx*=0.707; vy*=0.707; }

    const dt=delta/1000;
    this.px=Phaser.Math.Clamp(this.px+vx*dt,GRID_OFFSET_X+12,GRID_OFFSET_X+GRID_COLS*TILE-12);
    this.py=Phaser.Math.Clamp(this.py+vy*dt,GRID_OFFSET_Y+12,GRID_OFFSET_Y+GRID_ROWS*TILE-12);
    this.player.setPosition(this.px,this.py);
    this.playerDir.setPosition(this.px,this.py-16).setAngle({up:0,down:180,left:270,right:90}[this.facing]||0);

    if (this.buildMode) this._updateGhost();

    // 근처 건물/파이프 감지
    let nearest=null,nd=Infinity,nType=null;
    const RANGE=TILE*2.5;
    this.buildings.forEach(b=>{
      const d=Phaser.Math.Distance.Between(this.px,this.py,GRID_OFFSET_X+(b.col+b.w/2)*TILE,GRID_OFFSET_Y+(b.row+b.h/2)*TILE);
      if (d<RANGE&&d<nd) { nearest=b; nd=d; nType='bldg'; }
    });
    this.pipes.forEach(p=>{
      const d=Phaser.Math.Distance.Between(this.px,this.py,GRID_OFFSET_X+p.col*TILE+TILE/2,GRID_OFFSET_Y+p.row*TILE+TILE/2);
      if (d<RANGE&&d<nd) { nearest={...p,type:'pipe'}; nd=d; nType='pipe'; }
    });
    this.nearbyBuilding=nearest;
    if (nearest) {
      const lbl=nType==='pipe'?'파이프':BUILDING_DEFS[nearest.type].label;
      this.interactPrompt.setText(`[E] ${lbl}`)
        .setPosition(GRID_OFFSET_X+(nearest.col+(nearest.w||1)/2)*TILE,GRID_OFFSET_Y+nearest.row*TILE-6)
        .setVisible(true);
    } else {
      this.interactPrompt.setVisible(false);
    }
  }
}



// ══════════════════════════════════════════════════════════════
// 전투 시스템 전역 데이터
// ══════════════════════════════════════════════════════════════

if (!window.FIELD_DATA) window.FIELD_DATA = { cleared: new Set() };

// ── 드롭 테이블 정의
// 각 스테이지 클리어 시 적 한 마리당 1회 롤
// drops: [ { id, w(가중치), min, max } ]
const STAGE_DATA = {
  '1-1':  { world:'어둠의 숲', enemies:['slime'],          count:8,  expReward:8,
    drops:[{id:'energy_basic',w:60,min:1,max:3},{id:'gold',w:30,min:5,max:15}] },
  '1-2':  { world:'어둠의 숲', enemies:['slime','goblin'],  count:10, expReward:12,
    drops:[{id:'energy_basic',w:55,min:1,max:4},{id:'gold',w:32,min:8,max:20}] },
  '1-3':  { world:'어둠의 숲', enemies:['goblin'],          count:10, expReward:16,
    drops:[{id:'energy_basic',w:50,min:2,max:4},{id:'gold',w:30,min:10,max:25},{id:'energy_mid',w:3,min:1,max:1}] },
  '1-4':  { world:'어둠의 숲', enemies:['goblin','wolf'],   count:12, expReward:20,
    drops:[{id:'energy_basic',w:40,min:2,max:5},{id:'energy_mid',w:12,min:1,max:2},{id:'gold',w:30,min:15,max:30}] },
  '1-5':  { world:'어둠의 숲', enemies:['wolf'],             count:12, expReward:26,
    drops:[{id:'energy_basic',w:32,min:2,max:5},{id:'energy_mid',w:22,min:1,max:2},{id:'gold',w:28,min:20,max:40},{id:'core_efficiency',w:12,min:1,max:1},{id:'core_reduce',w:6,min:1,max:1}] },
  '1-6':  { world:'어둠의 숲', enemies:['wolf','orc'],       count:12, expReward:30,
    drops:[{id:'energy_basic',w:25,min:2,max:6},{id:'energy_mid',w:28,min:1,max:3},{id:'gold',w:28,min:25,max:50}] },
  '1-7':  { world:'어둠의 숲', enemies:['orc'],              count:14, expReward:36,
    drops:[{id:'energy_mid',w:45,min:1,max:3},{id:'energy_basic',w:18,min:2,max:5},{id:'gold',w:25,min:30,max:60}] },
  '1-8':  { world:'어둠의 숲', enemies:['orc','darkelf'],    count:14, expReward:42,
    drops:[{id:'energy_mid',w:40,min:2,max:4},{id:'energy_high',w:5,min:1,max:1},{id:'gold',w:28,min:35,max:70}] },
  '1-9':  { world:'어둠의 숲', enemies:['darkelf'],          count:16, expReward:48,
    drops:[{id:'energy_mid',w:35,min:2,max:4},{id:'energy_high',w:10,min:1,max:2},{id:'gold',w:25,min:40,max:80}] },
  '1-10': { world:'어둠의 숲', enemies:['darkelf','wolf'],   count:18, expReward:58,
    drops:[{id:'energy_mid',w:28,min:2,max:5},{id:'energy_high',w:18,min:1,max:2},{id:'gold',w:22,min:50,max:100}] },
  // 보스 — 보스게이트 건물로만 진입
  '1-BOSS':{ world:'어둠의 숲', enemies:['boss_golem'], count:1, expReward:200, isBoss:true,
    drops:[{id:'energy_high',w:35,min:3,max:6},{id:'gate_shard',w:28,min:1,max:2},{id:'upgrade_crystal',w:20,min:1,max:2},{id:'core_efficiency',w:12,min:1,max:1},{id:'core_reduce',w:5,min:1,max:1}] },
  // ══ World 2 — 마법의 숲 (gate_shard 1개 이상 보유 시 해금) ══
  '2-1': { world:'마법의 숲', enemies:['troll'],                    count:8,  expReward:50,
    drops:[{id:'energy_mid',w:40,min:2,max:5},{id:'energy_high',w:10,min:1,max:2},{id:'gold',w:35,min:30,max:60},{id:'iron',w:15,min:2,max:5}] },
  '2-2': { world:'마법의 숲', enemies:['troll','forest_spirit'],    count:10, expReward:65,
    drops:[{id:'energy_mid',w:35,min:2,max:5},{id:'energy_high',w:15,min:1,max:2},{id:'gold',w:30,min:35,max:70},{id:'ebony',w:20,min:1,max:3}] },
  '2-3': { world:'마법의 숲', enemies:['forest_spirit','dark_wizard'],count:10, expReward:80,
    drops:[{id:'energy_high',w:35,min:1,max:3},{id:'energy_mid',w:25,min:2,max:4},{id:'gold',w:25,min:40,max:80},{id:'hard_iron',w:15,min:1,max:2}] },
  '2-4': { world:'마법의 숲', enemies:['dark_wizard','stone_golem'], count:10, expReward:98,
    drops:[{id:'energy_high',w:40,min:2,max:4},{id:'gold',w:28,min:50,max:100},{id:'tough_ebony',w:20,min:1,max:2},{id:'core_efficiency',w:12,min:1,max:1}] },
  '2-5': { world:'마법의 숲', enemies:['stone_golem'],               count:12, expReward:120,
    drops:[{id:'energy_high',w:45,min:2,max:5},{id:'gold',w:25,min:60,max:120},{id:'iron_board',w:20,min:1,max:1},{id:'core_reduce',w:10,min:1,max:1}] },
  '2-BOSS':{ world:'마법의 숲', enemies:['boss_witch'], count:1, expReward:450, isBoss:true,
    drops:[{id:'energy_high',w:30,min:5,max:10},{id:'gate_shard',w:25,min:1,max:3},{id:'upgrade_crystal',w:20,min:2,max:3},{id:'diamond',w:15,min:2,max:5},{id:'ancient_oak',w:10,min:2,max:4}] },
};

// 드롭 1회 롤 함수
function rollOnce(drops) {
  const totalW = drops.reduce((s,d)=>s+d.w, 0);
  let r = Math.random()*totalW, acc=0;
  for (const d of drops) {
    acc+=d.w;
    if (r<acc) return { id:d.id, qty:d.min+Math.floor(Math.random()*(d.max-d.min+1)) };
  }
  const last=drops[drops.length-1];
  return { id:last.id, qty:last.min };
}

// ── 적 정의
const ENEMY_DEFS = {
  // World 1 — 어둠의 숲
  slime:        { label:'슬라임',       color:0x2ecc71, borderColor:0x27ae60, size:13, hp:35,   atk:6,  spd:50,  atkRange:18, atkCd:1400, detRange:200, exp:5   },
  goblin:       { label:'고블린',       color:0x8bc34a, borderColor:0x558b2f, size:14, hp:60,   atk:10, spd:68,  atkRange:20, atkCd:1200, detRange:220, exp:10  },
  wolf:         { label:'늑대',         color:0x795548, borderColor:0x4e342e, size:14, hp:80,   atk:14, spd:88,  atkRange:18, atkCd:1000, detRange:240, exp:15  },
  orc:          { label:'오크',         color:0x4caf50, borderColor:0x1b5e20, size:18, hp:130,  atk:20, spd:55,  atkRange:22, atkCd:1600, detRange:200, exp:22  },
  darkelf:      { label:'다크엘프',     color:0x673ab7, borderColor:0x311b92, size:14, hp:100,  atk:25, spd:82,  atkRange:18, atkCd:1100, detRange:260, exp:30  },
  boss_golem:   { label:'골렘 수호자',  color:0x546e7a, borderColor:0x263238, size:32, hp:800,  atk:35, spd:42,  atkRange:36, atkCd:2000, detRange:350, exp:150, isBoss:true },
  // World 2 — 마법의 숲
  troll:        { label:'트롤',         color:0x4e8836, borderColor:0x2d5c1e, size:20, hp:220,  atk:30, spd:45,  atkRange:24, atkCd:1800, detRange:210, exp:38  },
  dark_wizard:  { label:'다크 마법사',  color:0x7b2d8b, borderColor:0x4a1a5a, size:14, hp:130,  atk:36, spd:76,  atkRange:20, atkCd:1300, detRange:280, exp:44  },
  forest_spirit:{ label:'숲 정령',      color:0x34d6b5, borderColor:0x1a8a75, size:13, hp:100,  atk:28, spd:96,  atkRange:20, atkCd:1100, detRange:260, exp:32  },
  stone_golem:  { label:'돌 골렘',      color:0x78909c, borderColor:0x455a64, size:22, hp:350,  atk:42, spd:38,  atkRange:26, atkCd:2200, detRange:180, exp:60  },
  boss_witch:   { label:'숲의 마녀',    color:0x8e44ad, borderColor:0x5b2c6f, size:28, hp:1500, atk:55, spd:52,  atkRange:30, atkCd:1600, detRange:380, exp:300, isBoss:true },
};

// ── 플레이어 영구 스탯 (씬 이동 시 유지)
const PLAYER_STATS = {
  job:'검사', maxHp:200, hp:200,
  atk:30, def:8, spd:158,
  level:1, exp:0, expToNext:100,
};

// ══════════════════════════════════════════════════════════════
// StageSelectScene — 스테이지 선택
// ══════════════════════════════════════════════════════════════
class StageSelectScene extends Phaser.Scene {
  constructor() { super('StageSelectScene'); }

  create() {
    this.cameras.main.fadeIn(250);
    this.add.rectangle(0,0,GAME_WIDTH,GAME_HEIGHT,0x06000c).setOrigin(0);
    const bg=this.add.graphics();
    for (let i=0;i<50;i++) bg.fillStyle(0x1a0035,Phaser.Math.FloatBetween(0.1,0.3)).fillCircle(Phaser.Math.Between(0,GAME_WIDTH),Phaser.Math.Between(0,GAME_HEIGHT),Phaser.Math.Between(1,6));

    this.add.rectangle(0,0,GAME_WIDTH,52,0x0a0015).setOrigin(0);
    this.add.rectangle(0,51,GAME_WIDTH,2,0xe74c3c).setOrigin(0);
    this.add.text(GAME_WIDTH/2,26,'⚔️  필드 — 스테이지 선택',{fontSize:'16px',fill:'#e87070',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);

    const backBtn=this.add.rectangle(56,26,96,30,0x1a0a1a).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x4a2c6a);
    this.add.text(56,26,'← 마을로',{fontSize:'12px',fill:'#887799',fontFamily:'Arial'}).setOrigin(0.5);
    backBtn.on('pointerdown',()=>{ this.cameras.main.fadeOut(250); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('HubScene')); });

    const ps=PLAYER_STATS;
    this.add.text(GAME_WIDTH-130,26,`Lv.${ps.level} ${ps.job}  ATK:${ps.atk}  DEF:${ps.def}`,{fontSize:'10px',fill:'#7788aa',fontFamily:'Arial'}).setOrigin(1,0.5);
    this.add.rectangle(GAME_WIDTH-4,4,120,22,0x2a2000,0.9).setOrigin(1,0).setStrokeStyle(1,0x888800);
    this.add.text(GAME_WIDTH-8,15,`🪙 ${PLAYER_GOLD}`,{fontSize:'12px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,0.5);

    const world2Unlocked = playerInventory.count('gate_shard')>0 || FIELD_DATA.cleared.has('1-BOSS');
    this._buildWorldSection(60, '제1구역', '어둠의 숲', ['1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9','1-10'], '1-BOSS', true);
    if (world2Unlocked) {
      this._buildWorldSection(270, '제2구역', '마법의 숲', ['2-1','2-2','2-3','2-4','2-5'], '2-BOSS', true);
    } else {
      const ly=270;
      this.add.rectangle(GAME_WIDTH/2,ly+40,GAME_WIDTH-60,70,0x0a080a).setOrigin(0.5).setStrokeStyle(1,0x2a1a3a);
      this.add.text(GAME_WIDTH/2,ly+28,'🔒  제2구역 : 마법의 숲',{fontSize:'13px',fill:'#443344',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
      this.add.text(GAME_WIDTH/2,ly+50,'1구역 보스 처치 또는 차원의 파편 보유 시 해금',{fontSize:'10px',fill:'#332233',fontFamily:'Arial'}).setOrigin(0.5);
      this.add.text(GAME_WIDTH/2,ly+68,'( 차원의 파편 🔮 은 보스 처치 드롭 )',{fontSize:'9px',fill:'#221122',fontFamily:'Arial'}).setOrigin(0.5);
    }
  }

  _buildWorldSection(startY, worldLabel, worldName, stageIds, bossId, hasBossGate) {
    const COLS=5, BW=172, BH=58, GX=6, GY=6;
    const gridW=COLS*BW+(COLS-1)*GX;
    const sx=(GAME_WIDTH-gridW)/2, sy=startY+22;

    this.add.text(GAME_WIDTH/2,startY,`— ${worldLabel} : ${worldName} —`,{fontSize:'12px',fill:'#3a5a3a',fontFamily:'Arial'}).setOrigin(0.5);

    stageIds.forEach((id,i)=>{
      const col=i%COLS, row=Math.floor(i/COLS);
      const bx=sx+col*(BW+GX), by=sy+row*(BH+GY);
      const cleared=FIELD_DATA.cleared.has(id);
      const bgC=cleared?0x0c2010:0x0e0a1e, bdC=cleared?0x2ecc71:0x4a2c6a;

      const btn=this.add.rectangle(bx+BW/2,by+BH/2,BW,BH,bgC).setInteractive({useHandCursor:true}).setStrokeStyle(2,bdC);
      this.add.text(bx+BW/2,by+11,id,{fontSize:'14px',fill:'#ffffff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
      const sd=STAGE_DATA[id];
      const names=sd.enemies.map(e=>ENEMY_DEFS[e]?.label||e).join(', ');
      this.add.text(bx+BW/2,by+26,names,{fontSize:'8px',fill:'#778877',fontFamily:'Arial'}).setOrigin(0.5);
      const icons=(sd.drops||[]).slice(0,4).map(d=>ITEM_DEFS[d.id]?.icon||'?').join(' ');
      this.add.text(bx+BW/2,by+40,`${icons}  EXP+${sd.expReward}`,{fontSize:'8px',fill:'#445544',fontFamily:'Arial'}).setOrigin(0.5);
      this.add.text(bx+BW/2,by+52,`×${sd.count}마리`,{fontSize:'7px',fill:'#334433',fontFamily:'Arial'}).setOrigin(0.5);
      if (cleared) this.add.text(bx+BW-4,by+4,'✓',{fontSize:'12px',fill:'#2ecc71',fontFamily:'Arial'}).setOrigin(1,0);

      btn.on('pointerover',()=>btn.setFillStyle(cleared?0x184028:0x1a1035));
      btn.on('pointerout', ()=>btn.setFillStyle(bgC));
      btn.on('pointerdown',()=>this._startStage(id));
    });

    // 보스 안내
    const rows=Math.ceil(stageIds.length/COLS);
    const bossInfoY=sy+rows*(BH+GY)+4;
    const bossCleared=FIELD_DATA.cleared.has(bossId);
    this.add.rectangle(GAME_WIDTH/2,bossInfoY+18,GAME_WIDTH-60,32,0x0c0808).setStrokeStyle(1,0x3a1515);
    const bossMsg = hasBossGate
      ? (bossCleared?'✓ 보스 처치 완료':'💀 보스전 — 기지 [보스 게이트]에 에너지 충전 후 진입')
      : (bossCleared?'✓ 보스 처치 완료':'💀 보스전 — 기지 [보스 게이트]에 에너지 충전 후 진입');
    this.add.text(GAME_WIDTH/2,bossInfoY+18,bossMsg,{fontSize:'10px',fill:bossCleared?'#cc5544':'#553333',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
  }

  _startStage(id) {
    FIELD_DATA.currentStage=id;
    PLAYER_STATS.hp=PLAYER_STATS.maxHp;
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('FieldScene'));
  }
}

// ══════════════════════════════════════════════════════════════
// FieldScene — 핵앤슬래시 전투
// ══════════════════════════════════════════════════════════════
class FieldScene extends Phaser.Scene {
  constructor() { super('FieldScene'); }

  create() {
    this.cameras.main.fadeIn(250);
    this.stageId  = FIELD_DATA.currentStage || '1-1';
    this.stageDef = STAGE_DATA[this.stageId];
    this.isBoss   = !!this.stageDef.isBoss;

    const ps=PLAYER_STATS;
    this.pl = {
      x:FIELD_W/2, y:FIELD_H/2,
      hp:ps.hp, maxHp:ps.maxHp,
      atk:ps.atk, def:ps.def, spd:ps.spd,
      facing:0, alive:true, invincible:false, invTimer:0,
      autoMode:false,
    };
    this.skills = { spin:{ label:'선풍참', cooldown:4000, lastUsed:-9999 } };
    this.enemies      = [];
    this.enemyLabels  = [];   // 몬스터 이름 텍스트 오브젝트
    this.done         = false;
    this.autoAtkTimer = 0;

    // ── 웨이브 시스템 (60s 안에 5웨이브 몰아치기)
    this.currentWave   = 0;         // 지금까지 소환된 웨이브 수
    this.TOTAL_WAVES   = this.isBoss ? 1 : 5;
    this.BATTLE_DURATION = 60000;   // 전체 전투 시간 60초
    this.WAVE_INTERVAL   = 12000;   // 12초마다 웨이브 소환
    this.battleTimer   = this.BATTLE_DURATION;
    this.nextWaveIn    = 0;         // 즉시 첫 웨이브 소환
    this.waveActive    = false;

    this._buildBg();
    this.enemyGfx  = this.add.graphics().setDepth(20);
    this.atkArcGfx = this.add.graphics().setDepth(35);
    this.playerGfx = this.add.graphics().setDepth(40);

    // ── 카메라 줌아웃 + 플레이어 팔로우
    this.cameras.main.setZoom(FIELD_ZOOM);
    this.cameras.main.setBounds(0, 0, FIELD_W, FIELD_H);
    this.camTarget = this.add.rectangle(this.pl.x, this.pl.y, 2, 2, 0, 0).setDepth(0);
    this.cameras.main.startFollow(this.camTarget, true, 0.10, 0.10);

    this._buildHUD();

    // ── 입력
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({W:87,A:65,S:83,D:68});
    this.key1    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keyEsc  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // 마우스/터치 클릭 → 기본 공격 (worldX/Y 사용 — 카메라 줌 대응)
    this.input.on('pointerdown',(ptr)=>{
      if (!this.pl.autoMode && this.pl.alive && !this.done) {
        const angle=Math.atan2(ptr.worldY-this.pl.y, ptr.worldX-this.pl.x);
        this.pl.facing=angle;
        this._swingAttack(angle, false);
      }
    });
    this.key1.on('down',   ()=>this._trySkill('spin'));
    this.keyEsc.on('down', ()=>this._exitToSelect());

    this.joystick = new VirtualJoystick(this, 80, GAME_HEIGHT-70);
    // 조이스틱을 화면 고정으로
    this.joystick.base.setScrollFactor(0).setDepth(85);
    this.joystick.stick.setScrollFactor(0).setDepth(86);
    this._buildMobileButtons();
    this._showStageTitle();
    // 스테이지 타이틀 후 웨이브 타이머 시작
    this.time.delayedCall(1600, ()=>{ this.waveActive = true; });
  }

  // ── 배경
  _buildBg() {
    this.add.rectangle(0,0,FIELD_W,FIELD_H,0x080e08).setOrigin(0).setDepth(0);
    const g=this.add.graphics().setDepth(0);
    g.lineStyle(1,0x0d190d,1);
    for (let x=0;x<FIELD_W;x+=48) g.lineBetween(x,0,x,FIELD_H);
    for (let y=0;y<FIELD_H;y+=48) g.lineBetween(0,y,FIELD_W,y);
    // 장식용 덤불/바위
    for (let i=0;i<40;i++) {
      const rx=((i*97+13)%FIELD_W+FIELD_W)%FIELD_W;
      const ry=((i*53+7)%(FIELD_H)+FIELD_H)%FIELD_H;
      g.fillStyle(0x0a180a,1); g.fillCircle(rx,ry,Phaser.Math.Between(6,20));
    }
    // 필드 경계 표시
    g.lineStyle(3,0x1a3a1a,0.8);
    g.strokeRect(10,10,FIELD_W-20,FIELD_H-20);
  }

  // ── HUD
  _buildHUD() {
    const sf = (o) => o.setScrollFactor(0); // 화면 고정 헬퍼

    sf(this.add.rectangle(0,0,GAME_WIDTH,52,0x08000f,0.96).setOrigin(0).setDepth(80));
    sf(this.add.rectangle(0,51,GAME_WIDTH,2,0xe74c3c).setOrigin(0).setDepth(80));

    const backBtn=sf(this.add.rectangle(52,26,90,30,0x180a18).setInteractive({useHandCursor:true}).setDepth(81).setStrokeStyle(1,0x4a2c6a));
    sf(this.add.text(52,26,'← 나가기',{fontSize:'12px',fill:'#887799',fontFamily:'Arial'}).setOrigin(0.5).setDepth(82));
    backBtn.on('pointerdown',()=>this._exitToSelect());

    sf(this.add.text(GAME_WIDTH/2,15,`스테이지  ${this.stageId}`,{fontSize:'14px',fill:'#e87070',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(81));
    sf(this.add.text(GAME_WIDTH/2,34,this.stageDef.world,{fontSize:'10px',fill:'#3a5a3a',fontFamily:'Arial'}).setOrigin(0.5).setDepth(81));

    sf(this.add.text(113,18,'HP',{fontSize:'11px',fill:'#887788',fontFamily:'Arial'}).setOrigin(1,0.5).setDepth(81));
    this.hpBarBg=sf(this.add.rectangle(116,18,180,12,0x2a0e0e).setOrigin(0,0.5).setDepth(81));
    this.hpBar  =sf(this.add.rectangle(116,18,180,12,0xe74c3c).setOrigin(0,0.5).setDepth(82));
    this.hpText =sf(this.add.text(300,18,'',{fontSize:'10px',fill:'#ccaaaa',fontFamily:'Arial'}).setOrigin(0,0.5).setDepth(83));

    this.autoBtn=sf(this.add.rectangle(GAME_WIDTH-184,26,90,28,0x0e1828).setInteractive({useHandCursor:true}).setDepth(81).setStrokeStyle(1,0x3498db));
    this.autoBtnLbl=sf(this.add.text(GAME_WIDTH-184,26,'수동 모드',{fontSize:'11px',fill:'#4a8ab8',fontFamily:'Arial'}).setOrigin(0.5).setDepth(82));
    this.autoBtn.on('pointerdown',()=>this._toggleAuto());

    this.enemyCounter=sf(this.add.text(GAME_WIDTH/2-140,36,'',{fontSize:'11px',fill:'#f1c40f',fontFamily:'Arial'}).setOrigin(0,0.5).setDepth(81));
    sf(this.add.rectangle(GAME_WIDTH-4,4,120,22,0x2a2000,0.9).setOrigin(1,0).setDepth(82).setStrokeStyle(1,0x888800));
    this.goldText=sf(this.add.text(GAME_WIDTH-8,15,'',{fontSize:'12px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,0.5).setDepth(83));

    // 스킬 쿨타임 오버레이 (원형 버튼 위에 표시)
    this.skill1Bg=null;
    this.skill1CdOverlay=sf(this.add.circle(GAME_WIDTH-80,GAME_HEIGHT-158,30,0x000000,0).setDepth(91));
    this.skill1CdText=sf(this.add.text(GAME_WIDTH-80,GAME_HEIGHT-158,'',{fontSize:'13px',fill:'#ffffff',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(92));
  }

  _buildMobileButtons() {
    const sf = (o) => o.setScrollFactor(0);
    const atkBtn=sf(this.add.circle(GAME_WIDTH-80,GAME_HEIGHT-80,34,0x3a1a4a,0.8).setDepth(81).setInteractive({useHandCursor:true}));
    atkBtn.setStrokeStyle(2,0x9b59b6);
    sf(this.add.text(GAME_WIDTH-80,GAME_HEIGHT-80,'⚔️',{fontSize:'22px'}).setOrigin(0.5).setDepth(82));
    atkBtn.on('pointerdown',()=>{ if (!this.pl.autoMode && this.pl.alive && !this.done) this._swingAttack(this.pl.facing,false); });

    const sk1Btn=sf(this.add.circle(GAME_WIDTH-80,GAME_HEIGHT-158,30,0x2a1a3a,0.8).setDepth(81).setInteractive({useHandCursor:true}));
    sk1Btn.setStrokeStyle(2,0x6c3483);
    sf(this.add.text(GAME_WIDTH-80,GAME_HEIGHT-158,'🌀',{fontSize:'18px'}).setOrigin(0.5).setDepth(82));
    sk1Btn.on('pointerdown',()=>this._trySkill('spin'));
  }

  _startNextWave() {
    if (this.done || this.currentWave >= this.TOTAL_WAVES) return;
    this.currentWave++;

    const sd=this.stageDef;
    // 웨이브마다 몬스터 수 증가 (보스 고정)
    const spawnCount = this.isBoss ? sd.count : sd.count + (this.currentWave - 1) * 2;

    // 웨이브 알림 (화면 고정)
    const wt=this.add.text(GAME_WIDTH/2, 80,
      this.isBoss ? '💀 보스 등장!' : `웨이브 ${this.currentWave} / ${this.TOTAL_WAVES}  🌊`, {
      fontSize:'22px', fill:this.isBoss?'#e74c3c':'#f1c40f',
      fontFamily:'Arial', fontStyle:'bold', stroke:'#000000', strokeThickness:4
    }).setOrigin(0.5).setDepth(90).setScrollFactor(0).setAlpha(0);
    this.tweens.add({targets:wt, alpha:1, duration:250, yoyo:true, hold:700, onComplete:()=>wt.destroy()});

    // 몬스터 스폰 — 플레이어 주변에 원형 배치, 더 넓은 거리
    for (let i=0; i<spawnCount; i++) {
      const type=sd.enemies[i%sd.enemies.length];
      const def=ENEMY_DEFS[type];
      const angle=Math.PI*2*i/spawnCount + Phaser.Math.FloatBetween(-0.3,0.3);
      const dist=this.isBoss ? 350 : Phaser.Math.FloatBetween(380, 560);
      const ex=Phaser.Math.Clamp(this.pl.x+Math.cos(angle)*dist, 30, FIELD_W-30);
      const ey=Phaser.Math.Clamp(this.pl.y+Math.sin(angle)*dist, 30, FIELD_H-30);
      const e={ type,def,x:ex,y:ey,hp:def.hp,maxHp:def.hp,alive:true,knockVx:0,knockVy:0,atkCooldown:0 };
      this.enemies.push(e);
      const lblColor=def.isBoss?'#ff4444':def.size>=18?'#ffaa44':'#ffffff';
      const lbl=this.add.text(ex, ey-def.size-14, def.label, {
        fontSize:'10px', fill:lblColor, fontFamily:'Arial', fontStyle:def.isBoss?'bold':'normal',
        stroke:'#000000', strokeThickness:3
      }).setOrigin(0.5).setDepth(22);
      this.enemyLabels.push({e,lbl});
    }
  }

  _spawnEnemies() {
    // 레거시 — 웨이브 시스템으로 대체됨 (사용 안 함)
  }

  _showStageTitle() {
    const t1=this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2-24,`스테이지  ${this.stageId}`,{
      fontSize:'30px',fill:'#ffffff',fontFamily:'Arial',fontStyle:'bold',stroke:'#000000',strokeThickness:5
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setAlpha(0);
    const sub=this.isBoss?'💀  BOSS  STAGE':this.stageDef.enemies.map(e=>ENEMY_DEFS[e]?.label||e).join(' · ');
    const t2=this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2+14,sub,{
      fontSize:'14px',fill:this.isBoss?'#e87070':'#888888',fontFamily:'Arial',stroke:'#000000',strokeThickness:3
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setAlpha(0);
    this.tweens.add({targets:[t1,t2],alpha:1,duration:350,yoyo:true,hold:1000,onComplete:()=>{t1.destroy();t2.destroy();}});
  }

  _toggleAuto() {
    this.pl.autoMode=!this.pl.autoMode;
    if (this.pl.autoMode) {
      this.autoBtnLbl.setText('자동 모드').setStyle({fill:'#2ecc71'});
      this.autoBtn.setFillStyle(0x0e2a1a).setStrokeStyle(1,0x2ecc71);
    } else {
      this.autoBtnLbl.setText('수동 모드').setStyle({fill:'#4a8ab8'});
      this.autoBtn.setFillStyle(0x0e1828).setStrokeStyle(1,0x3498db);
    }
  }

  // ── 공격
  _swingAttack(angle, isMirrored) {
    if (!this.pl.alive||this.done) return;
    const p=this.pl, ARC=Phaser.Math.DegToRad(100), RANGE=115;
    this._drawSwingArc(p.x,p.y,angle,ARC,RANGE);
    this.enemies.forEach(e=>{
      if (!e.alive) return;
      const dx=e.x-p.x, dy=e.y-p.y;
      if (Math.sqrt(dx*dx+dy*dy)>RANGE+e.def.size) return;
      const ea=Math.atan2(dy,dx);
      let diff=ea-angle;
      while(diff> Math.PI) diff-=Math.PI*2;
      while(diff<-Math.PI) diff+=Math.PI*2;
      if (Math.abs(diff)>ARC/2) return;
      const dmg=Math.max(1,p.atk+Phaser.Math.Between(-4,4));
      const nd=Math.sqrt(dx*dx+dy*dy)||1;
      this._hitEnemy(e,dmg,dx/nd,dy/nd,false);
    });
  }

  _spinAttack() {
    if (!this.pl.alive||this.done) return;
    const p=this.pl, RANGE=130;
    this._drawSpinFx(p.x,p.y,RANGE);
    this.enemies.forEach(e=>{
      if (!e.alive) return;
      const dx=e.x-p.x, dy=e.y-p.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if (dist>RANGE+e.def.size) return;
      const dmg=Math.max(1,Math.floor(p.atk*1.9)+Phaser.Math.Between(-6,6));
      const nd=dist||1;
      this._hitEnemy(e,dmg,dx/nd,dy/nd,true);
    });
  }

  _trySkill(id) {
    if (!this.pl.alive||this.done) return;
    const sk=this.skills[id]; if (!sk) return;
    const now=this.time.now;
    if (now-sk.lastUsed<sk.cooldown) return;
    sk.lastUsed=now;
    if (id==='spin') this._spinAttack();
  }

  // ── 피격
  _hitEnemy(e,dmg,nx,ny,isCrit) {
    e.hp=Math.max(0,e.hp-dmg);
    e.knockVx=nx*160; e.knockVy=ny*160;
    this._spawnDmgText(e.x,e.y-e.def.size,dmg,isCrit);
    if (e.hp<=0&&e.alive) { e.alive=false; this._onEnemyDeath(e); }
  }

  _hitPlayer(dmg) {
    if (this.pl.invincible||!this.pl.alive||this.done) return;
    const actual=Math.max(1,dmg-this.pl.def);
    this.pl.hp=Math.max(0,this.pl.hp-actual);
    this.pl.invincible=true; this.pl.invTimer=700;
    this._spawnDmgText(this.pl.x,this.pl.y-20,actual,false);
    this.cameras.main.shake(100,0.005);
    if (this.pl.hp<=0) { this.pl.alive=false; this.time.delayedCall(400,()=>this._gameOver()); }
  }

  // ── 적 사망 & 드롭
  _onEnemyDeath(e) {
    // 사망 파티클
    const g=this.add.graphics().setDepth(25);
    g.fillStyle(e.def.color,0.7); g.fillCircle(e.x,e.y,e.def.size*1.8);
    this.tweens.add({targets:g,alpha:0,scaleX:2.4,scaleY:2.4,duration:360,onComplete:()=>g.destroy()});

    // 드롭 1회 롤
    if (this.stageDef.drops?.length) {
      const drop=rollOnce(this.stageDef.drops);
      if (drop.id==='gold') {
        PLAYER_GOLD+=drop.qty;
        this._spawnPickupText(e.x,e.y-10,`🪙 +${drop.qty}`,'#f1c40f');
        this._refreshGoldHUD();
      } else {
        playerInventory.add(drop.id,drop.qty);
        const di=ITEM_DEFS[drop.id];
        if (di) this._spawnPickupText(e.x,e.y-10,`${di.icon} +${drop.qty}`,'#f5f0aa');
      }
    }

    // EXP
    PLAYER_STATS.exp+=e.def.exp;
    if (PLAYER_STATS.exp>=PLAYER_STATS.expToNext) {
      PLAYER_STATS.level++;
      PLAYER_STATS.exp-=PLAYER_STATS.expToNext;
      PLAYER_STATS.expToNext=Math.floor(PLAYER_STATS.expToNext*1.45);
      PLAYER_STATS.atk+=3; PLAYER_STATS.maxHp+=15; PLAYER_STATS.def+=1;
      this.pl.atk=PLAYER_STATS.atk; this.pl.maxHp=PLAYER_STATS.maxHp;
      this.pl.hp=Math.min(this.pl.hp+30,this.pl.maxHp);
      this._showLevelUp();
    }

    // 모든 웨이브 소환 완료 + 모든 적 처치 → 클리어
    if (this.currentWave >= this.TOTAL_WAVES && this.enemies.every(e=>!e.alive) && !this.done) {
      this.time.delayedCall(400, ()=>this._stageClear());
    }
  }

  // ── 클리어 / 게임오버
  _stageClear() {
    if (this.done) return;
    this.done=true;
    FIELD_DATA.cleared.add(this.stageId);
    PLAYER_STATS.hp=this.pl.hp;

    this.add.rectangle(GAME_WIDTH/2,GAME_HEIGHT/2,GAME_WIDTH,GAME_HEIGHT,0x000000,0.65).setDepth(90).setScrollFactor(0);
    this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2-80,'✨  STAGE  CLEAR!',{
      fontSize:'34px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:5
    }).setOrigin(0.5).setDepth(91).setScrollFactor(0);
    this.cameras.main.flash(400,255,220,60);

    PLAYER_STATS.exp+=this.stageDef.expReward;
    this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2-44,`EXP  +${this.stageDef.expReward}`,{fontSize:'16px',fill:'#2ecc71',fontFamily:'Arial'}).setOrigin(0.5).setDepth(91).setScrollFactor(0);
    this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2-22,`Lv.${PLAYER_STATS.level}  HP:${this.pl.hp}/${this.pl.maxHp}`,{fontSize:'13px',fill:'#8888aa',fontFamily:'Arial'}).setOrigin(0.5).setDepth(91).setScrollFactor(0);

    if (this.isBoss) {
      this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2+2,'🏆  골렘 수호자 처치!',{fontSize:'15px',fill:'#e74c3c',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(91).setScrollFactor(0);
      if (this.stageDef.drops?.length) {
        const drop=rollOnce(this.stageDef.drops);
        if (drop.id==='gold') { PLAYER_GOLD+=drop.qty; } else { playerInventory.add(drop.id,drop.qty); }
        const di=ITEM_DEFS[drop.id];
        const col=di?('#'+di.color.toString(16).padStart(6,'0')):'#ffffff';
        this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2+22,`${di?.icon||''}  ${di?.label||drop.id}  ×${drop.qty}  획득!`,{fontSize:'14px',fill:col,fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5).setDepth(91).setScrollFactor(0);
      }
    }

    this._addResultButtons(true);
  }

  _gameOver() {
    if (this.done) return;
    this.done=true; PLAYER_STATS.hp=Math.max(1,this.pl.hp);
    this.add.rectangle(GAME_WIDTH/2,GAME_HEIGHT/2,GAME_WIDTH,GAME_HEIGHT,0x000000,0.75).setDepth(90).setScrollFactor(0);
    this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2-60,'💀  GAME  OVER',{
      fontSize:'34px',fill:'#e74c3c',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:5
    }).setOrigin(0.5).setDepth(91).setScrollFactor(0);
    this.add.text(GAME_WIDTH/2,GAME_HEIGHT/2-20,`스테이지  ${this.stageId}  실패`,{fontSize:'14px',fill:'#888888',fontFamily:'Arial'}).setOrigin(0.5).setDepth(91).setScrollFactor(0);
    this.cameras.main.shake(300,0.012);
    this._addResultButtons(false);
  }

  _addResultButtons(isWin) {
    const by=GAME_HEIGHT/2+54;
    const r1=this.add.rectangle(GAME_WIDTH/2-86,by,152,40,isWin?0x0e2a1a:0x2a0e0e).setInteractive({useHandCursor:true}).setDepth(91).setStrokeStyle(2,isWin?0x2ecc71:0xe74c3c).setScrollFactor(0);
    this.add.text(GAME_WIDTH/2-86,by,'다시 하기',{fontSize:'14px',fill:isWin?'#2ecc71':'#e74c3c',fontFamily:'Arial'}).setOrigin(0.5).setDepth(92).setScrollFactor(0);
    r1.on('pointerdown',()=>{ PLAYER_STATS.hp=PLAYER_STATS.maxHp; this.cameras.main.fadeOut(250); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('FieldScene')); });
    const r2=this.add.rectangle(GAME_WIDTH/2+86,by,152,40,0x0e0e2a).setInteractive({useHandCursor:true}).setDepth(91).setStrokeStyle(2,0x9b59b6).setScrollFactor(0);
    this.add.text(GAME_WIDTH/2+86,by,'스테이지 선택',{fontSize:'14px',fill:'#c39bd3',fontFamily:'Arial'}).setOrigin(0.5).setDepth(92).setScrollFactor(0);
    r2.on('pointerdown',()=>this._exitToSelect());
  }

  _exitToSelect() {
    PLAYER_STATS.hp=Math.max(1,this.pl.hp);
    this.enemyLabels?.forEach(({lbl})=>lbl.destroy());
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete',()=>{ this.joystick.destroy(); this.scene.start('StageSelectScene'); });
  }

  // ── 이펙트
  _drawSwingArc(ox,oy,angle,arc,range) {
    const g=this.atkArcGfx; g.clear();
    g.fillStyle(0xf0e6ff,0.2); g.lineStyle(3,0xd4b8ff,0.9);
    g.beginPath(); g.moveTo(ox,oy);
    const steps=16;
    for (let i=0;i<=steps;i++) {
      const a=angle-arc/2+(arc/steps)*i;
      g.lineTo(ox+Math.cos(a)*range,oy+Math.sin(a)*range);
    }
    g.closePath(); g.fillPath(); g.strokePath();
    g.lineStyle(2,0xffffff,0.7); g.lineBetween(ox,oy,ox+Math.cos(angle)*range,oy+Math.sin(angle)*range);
    this.time.delayedCall(150,()=>g.clear());
  }

  _drawSpinFx(ox,oy,range) {
    const g=this.atkArcGfx; g.clear();
    g.fillStyle(0xc39bd3,0.14); g.fillCircle(ox,oy,range);
    for (let r=range;r>range-40;r-=8) {
      const a=0.1+(range-r)/40*0.8;
      g.lineStyle(3,0xd4b8ff,a); g.strokeCircle(ox,oy,r);
    }
    for (let i=0;i<8;i++) {
      const a=Math.PI*2*i/8;
      g.lineStyle(2,0xffffff,0.5); g.lineBetween(ox,oy,ox+Math.cos(a)*range,oy+Math.sin(a)*range);
    }
    this.tweens.add({targets:{t:1},t:0,duration:400,onUpdate:(tw)=>g.setAlpha(tw.getValue()),onComplete:()=>{g.clear();g.setAlpha(1);}});
  }

  _spawnDmgText(x,y,dmg,isCrit) {
    const col=isCrit?'#f39c12':'#ff8888', sz=isCrit?'16px':'13px';
    const tx=x+Phaser.Math.Between(-14,14);
    const t=this.add.text(tx,y,`${dmg}`,{fontSize:sz,fill:col,fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setDepth(60);
    this.tweens.add({targets:t,y:y-38,alpha:0,duration:820,ease:'Power2',onComplete:()=>t.destroy()});
  }

  _spawnPickupText(x,y,msg,col) {
    const t=this.add.text(x,y,msg,{fontSize:'12px',fill:col,fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(58);
    this.tweens.add({targets:t,y:y-32,alpha:0,duration:1100,onComplete:()=>t.destroy()});
  }

  _showLevelUp() {
    const t=this.add.text(this.pl.x,this.pl.y-44,'LEVEL UP! 🎉',{
      fontSize:'18px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold',stroke:'#000',strokeThickness:4
    }).setOrigin(0.5).setDepth(65);
    this.cameras.main.flash(300,255,220,80);
    this.tweens.add({targets:t,y:t.y-50,alpha:0,duration:1400,onComplete:()=>t.destroy()});
  }

  // ── HUD 갱신
  _refreshGoldHUD() { if (this.goldText) this.goldText.setText(`🪙 ${PLAYER_GOLD}`); }
  _updateHUD() {
    const p=this.pl;
    const ratio=Math.max(0,p.hp/p.maxHp);
    this.hpBar.setScale(ratio,1);
    this.hpText.setText(`${p.hp} / ${p.maxHp}`);
    const aliveNow=this.enemies.filter(e=>e.alive).length;
    const timeLeft=Math.max(0, Math.ceil((this.battleTimer||0)/1000));
    const waveInfo=this.isBoss?'BOSS':
      `W${this.currentWave||0}/${this.TOTAL_WAVES||5}  ⏱${timeLeft}s`;
    this.enemyCounter.setText(`👾 ${aliveNow}  |  ${waveInfo}`);
    this._refreshGoldHUD();
    // 스킬 쿨타임
    const remain=this.skills.spin.cooldown-(this.time.now-this.skills.spin.lastUsed);
    if (remain>0) {
      this.skill1CdOverlay.setAlpha(0.6);
      this.skill1CdText.setText(`${(remain/1000).toFixed(1)}`);
      if (this.skill1Bg) this.skill1Bg.setFillStyle(0x100818);
    } else {
      this.skill1CdOverlay.setAlpha(0);
      this.skill1CdText.setText('');
      if (this.skill1Bg) this.skill1Bg.setFillStyle(0x180828);
    }
  }

  // ── update
  update(t,delta) {
    const dt=delta/1000;
    const p=this.pl;
    this.joystick.update(this);
    if (this.done) return;

    if (p.alive) {
      if (p.autoMode) {
        // 자동 이동
        const near=this._nearestAlive();
        if (near) {
          const dx=near.x-p.x, dy=near.y-p.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if (dist>90) { p.x+=dx/dist*p.spd*dt; p.y+=dy/dist*p.spd*dt; }
          p.facing=Math.atan2(dy,dx);
        }
        // 자동 공격
        this.autoAtkTimer-=delta;
        if (this.autoAtkTimer<=0) {
          this.autoAtkTimer=650;
          const near2=this._nearestAlive();
          if (near2) { p.facing=Math.atan2(near2.y-p.y,near2.x-p.x); this._swingAttack(p.facing,false); }
        }
        // 자동 스킬
        const nearCount=this.enemies.filter(e=>e.alive&&Math.hypot(e.x-p.x,e.y-p.y)<140).length;
        if (nearCount>=2) this._trySkill('spin');
      } else {
        // 수동 이동
        let vx=0,vy=0;
        if (this.wasd.A.isDown||this.cursors.left.isDown)  vx=-p.spd;
        if (this.wasd.D.isDown||this.cursors.right.isDown) vx= p.spd;
        if (this.wasd.W.isDown||this.cursors.up.isDown)    vy=-p.spd;
        if (this.wasd.S.isDown||this.cursors.down.isDown)  vy= p.spd;
        if (this.joystick.active) { vx=this.joystick.vx*p.spd; vy=this.joystick.vy*p.spd; }
        if (vx&&vy) { vx*=0.707; vy*=0.707; }
        p.x+=vx*dt; p.y+=vy*dt;
        p.facing=Math.atan2(this.input.activePointer.worldY-p.y,this.input.activePointer.worldX-p.x);
      }
      p.x=Phaser.Math.Clamp(p.x, 20, FIELD_W-20);
      p.y=Phaser.Math.Clamp(p.y, 30, FIELD_H-20);
      if (p.invincible) { p.invTimer-=delta; if (p.invTimer<=0) p.invincible=false; }
    }

    // ── 전투 타이머 (60초 카운트다운, 12초마다 웨이브 소환)
    if (this.waveActive && !this.done) {
      this.battleTimer -= delta;
      this.nextWaveIn  -= delta;

      // 다음 웨이브 소환 타이밍
      if (this.nextWaveIn <= 0 && this.currentWave < this.TOTAL_WAVES) {
        this._startNextWave();
        this.nextWaveIn = this.WAVE_INTERVAL;
      }

      // 60초 경과 → 스테이지 클리어
      if (this.battleTimer <= 0 && !this.done) {
        this.waveActive = false;
        this.enemies.forEach(e=>{ e.alive=false; });
        this.enemyLabels.forEach(({lbl})=>lbl.setVisible(false));
        this.time.delayedCall(400, ()=>this._stageClear());
      }
    }

    // camTarget 동기화 (카메라 팔로우용)
    if (this.camTarget) this.camTarget.setPosition(this.pl.x, this.pl.y);

    // ── 이름 텍스트 위치 동기화
    this.enemyLabels.forEach(({e,lbl})=>{
      if (!e.alive) { lbl.setVisible(false); return; }
      lbl.setVisible(true).setPosition(e.x, e.y-e.def.size-13);
    });

    // ── 적 AI (항상 돌진)
    this.enemies.forEach(e=>{
      if (!e.alive) return;

      // 넉백 처리
      if (Math.abs(e.knockVx)>1||Math.abs(e.knockVy)>1) {
        e.x+=e.knockVx*dt; e.y+=e.knockVy*dt;
        e.knockVx*=0.76; e.knockVy*=0.76;
        e.x=Phaser.Math.Clamp(e.x,20,GAME_WIDTH-20);
        e.y=Phaser.Math.Clamp(e.y,60,GAME_HEIGHT-20);
      }

      const dx=p.x-e.x, dy=p.y-e.y;
      const dist=Math.sqrt(dx*dx+dy*dy)||1;

      // 항상 플레이어 방향으로 돌진 (detRange 무관)
      // 웨이브 후반부(2웨이브~)는 속도 소폭 증가
      const waveBoost = Math.min(1 + (this.currentWave-1)*0.12, 1.6);
      const spd = e.def.spd * waveBoost;
      e.x += dx/dist * spd * dt;
      e.y += dy/dist * spd * dt;
      e.x=Phaser.Math.Clamp(e.x, 20, FIELD_W-20);
      e.y=Phaser.Math.Clamp(e.y, 30, FIELD_H-20);

      e.atkCooldown=Math.max(0,e.atkCooldown-delta);
      if (dist<=e.def.atkRange+14&&e.atkCooldown<=0) {
        this._hitPlayer(e.def.atk); e.atkCooldown=e.def.atkCd;
      }
    });

    this._renderEnemies();
    this._renderPlayer();
    this._updateHUD();
  }

  _nearestAlive() {
    let best=null,bd=Infinity;
    this.enemies.forEach(e=>{ if (!e.alive) return; const d=Math.hypot(e.x-this.pl.x,e.y-this.pl.y); if(d<bd){bd=d;best=e;} });
    return best;
  }

  _renderEnemies() {
    const g=this.enemyGfx; g.clear();
    this.enemies.forEach(e=>{
      if (!e.alive) return;
      const sz=e.def.size;
      g.fillStyle(0x000000,0.22); g.fillEllipse(e.x+2,e.y+sz*0.7,sz*2.2,sz*0.9);
      g.fillStyle(e.def.color,1); g.fillCircle(e.x,e.y,sz);
      g.lineStyle(2,e.def.borderColor,1); g.strokeCircle(e.x,e.y,sz);
      const bw=sz*2.6;
      g.fillStyle(0x1a1a1a,0.9); g.fillRect(e.x-bw/2,e.y-sz-12,bw,6);
      const ratio=e.hp/e.maxHp;
      g.fillStyle(ratio>0.5?0x2ecc71:ratio>0.25?0xf39c12:0xe74c3c,1); g.fillRect(e.x-bw/2,e.y-sz-12,bw*ratio,6);
      if (e.def.isBoss) { g.lineStyle(1,0xe74c3c,0.8); g.strokeRect(e.x-bw/2-1,e.y-sz-13,bw+2,8); }
    });
  }

  _renderPlayer() {
    const g=this.playerGfx; g.clear();
    const p=this.pl; if (!p.alive) return;
    const blink=p.invincible&&Math.floor(this.time.now/80)%2===0;
    const alpha=blink?0.25:1;
    g.fillStyle(0x000000,0.2*alpha); g.fillEllipse(p.x+2,p.y+16,28,10);
    g.fillStyle(0xd8c8f0,alpha); g.fillCircle(p.x,p.y,15);
    g.lineStyle(2,0xc39bd3,alpha); g.strokeCircle(p.x,p.y,15);
    const fx=p.x+Math.cos(p.facing)*24,fy=p.y+Math.sin(p.facing)*24;
    g.lineStyle(3,0xf0e6ff,alpha*0.9); g.lineBetween(p.x,p.y,fx,fy);
    if (p.autoMode) { g.lineStyle(1,0x2ecc71,0.5*alpha); g.strokeCircle(p.x,p.y,20); }
  }
}

// ══════════════════════════════════════════════════════════════
// CraftScene — 제작소 (자원 가공 + 판자 제작)
// ══════════════════════════════════════════════════════════════
class CraftScene extends Phaser.Scene {
  constructor() { super('CraftScene'); }

  create() {
    this.cameras.main.fadeIn(250);
    this.selectedCat    = '가공';
    this.selectedRecipe = null;
    this._listObjs      = [];
    this._detailObjs    = [];

    // ── 배경
    this.add.rectangle(0,0,GAME_WIDTH,GAME_HEIGHT,0x060010).setOrigin(0);

    // ── 헤더
    this.add.rectangle(0,0,GAME_WIDTH,52,0x0a0015).setOrigin(0);
    this.add.rectangle(0,51,GAME_WIDTH,2,0x3498db).setOrigin(0);
    this.add.text(GAME_WIDTH/2,26,'⚗️  제작소',{fontSize:'16px',fill:'#3498db',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);

    const backBtn=this.add.rectangle(56,26,90,30,0x1a0a1a).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x4a2c6a);
    this.add.text(56,26,'← 기지로',{fontSize:'12px',fill:'#887799',fontFamily:'Arial'}).setOrigin(0.5);
    backBtn.on('pointerdown',()=>{ this.cameras.main.fadeOut(250); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('BaseScene')); });

    this.add.rectangle(GAME_WIDTH-4,4,120,22,0x2a2000,0.9).setOrigin(1,0).setStrokeStyle(1,0x888800);
    this.goldText=this.add.text(GAME_WIDTH-8,15,'',{fontSize:'12px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,0.5);

    // ── 레이아웃
    const LX=0, LY=52, LW=290;
    const DX=LW, DY=52, DW=GAME_WIDTH-LW;
    const BH=GAME_HEIGHT-52;

    this.add.rectangle(LX,LY,LW,BH,0x080010,0.95).setOrigin(0).setStrokeStyle(1,0x1a0a30);
    this.add.rectangle(DX,DY,DW,BH,0x04000a,0.95).setOrigin(0).setStrokeStyle(1,0x100820);

    // ── 카테고리 탭
    this._catTabBgs={}; this._catTabTxts={};
    ['가공','판자'].forEach((cat,i)=>{
      const tx=LX+6+i*142, ty=LY+18;
      const bg=this.add.rectangle(tx,ty,136,26,0x1a0a2a).setOrigin(0,0.5).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x3a1a4a);
      const txt=this.add.text(tx+68,ty,cat,{fontSize:'12px',fill:'#888888',fontFamily:'Arial'}).setOrigin(0.5);
      bg.on('pointerdown',()=>this._selectCategory(cat));
      this._catTabBgs[cat]=bg; this._catTabTxts[cat]=txt;
    });

    // ── 인벤토리
    this.inventoryUI=new InventoryUI(this,playerInventory,{title:'🎒 인벤토리',depth:95,y:280});
    this.keyI  =this.input.keyboard.addKey(73);
    this.keyEsc=this.input.keyboard.addKey(27);
    this.keyI.on('down',()=>this.inventoryUI.toggle());
    this.keyEsc.on('down',()=>{
      if (this.inventoryUI.visible){this.inventoryUI.hide();return;}
      this.cameras.main.fadeOut(250);
      this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('BaseScene'));
    });

    this.hintTxt=this.add.text(GAME_WIDTH/2,GAME_HEIGHT-14,'I: 인벤토리  ESC: 기지로',{fontSize:'10px',fill:'#334433',fontFamily:'Arial'}).setOrigin(0.5).setDepth(5);
    this._selectCategory('가공');
  }

  _selectCategory(cat) {
    this.selectedCat=cat; this.selectedRecipe=null;
    Object.entries(this._catTabBgs).forEach(([c,bg])=>{
      bg.setFillStyle(c===cat?0x2a1a4a:0x1a0a2a).setStrokeStyle(1,c===cat?0x9b59b6:0x3a1a4a);
      this._catTabTxts[c].setStyle({fill:c===cat?'#c39bd3':'#888888'});
    });
    this._buildRecipeList();
    this._buildRecipeDetail(null);
  }

  _craftEnergyCost(recipe) {
    return recipe.cat==='판자' ? 3 : 1;
  }

  _canCraft(recipe) {
    const energyCost = this._craftEnergyCost(recipe);
    return recipe.inputs.every(inp=>playerInventory.count(inp.id)>=inp.qty)
      && playerInventory.count('energy_basic') >= energyCost;
  }

  _buildRecipeList() {
    this._listObjs.forEach(o=>{try{o.destroy();}catch(e){}});
    this._listObjs=[];
    const R=o=>{this._listObjs.push(o);return o;};

    const recipes=CRAFT_RECIPES.filter(r=>r.cat===this.selectedCat);
    const LX=4, LY=52+36, IH=48, IW=282;

    recipes.forEach((recipe,i)=>{
      const ry=LY+i*IH;
      const canCraft=this._canCraft(recipe);
      const isSelected=this.selectedRecipe?.id===recipe.id;
      const outDef=ITEM_DEFS[recipe.out.id];

      const bg=R(this.add.rectangle(LX,ry,IW,IH-2,isSelected?0x1a1a4a:(canCraft?0x0a140a:0x100a18)).setOrigin(0)
        .setInteractive({useHandCursor:true})
        .setStrokeStyle(1,isSelected?0x9b59b6:(canCraft?0x2a4a2a:0x2a1a3a)));
      R(this.add.text(LX+10,ry+IH/2,outDef?.icon||'?',{fontSize:'22px'}).setOrigin(0,0.5));
      R(this.add.text(LX+42,ry+12,recipe.label,{fontSize:'12px',fill:canCraft?'#aaffaa':'#cccccc',fontFamily:'Arial'}));
      R(this.add.text(LX+42,ry+28,`${recipe.time}  ⚡×${this._craftEnergyCost(recipe)}`,{fontSize:'9px',fill:'#446644',fontFamily:'Arial'}));

      bg.on('pointerover',()=>{if(!isSelected) bg.setFillStyle(canCraft?0x142814:0x1a0f28);});
      bg.on('pointerout', ()=>{if(!isSelected) bg.setFillStyle(canCraft?0x0a140a:0x100a18);});
      bg.on('pointerdown',()=>this._selectRecipe(recipe));
    });

    if (recipes.length===0) {
      R(this.add.text(145,LY+60,'레시피 없음',{fontSize:'12px',fill:'#333333',fontFamily:'Arial'}).setOrigin(0.5));
    }
  }

  _selectRecipe(recipe) {
    this.selectedRecipe=recipe;
    this._buildRecipeList();
    this._buildRecipeDetail(recipe);
  }

  _buildRecipeDetail(recipe) {
    this._detailObjs.forEach(o=>{try{o.destroy();}catch(e){}});
    this._detailObjs=[];
    const R=o=>{this._detailObjs.push(o);return o;};
    const DX=GAME_WIDTH-670, DY=52, DW=660;

    if (!recipe) {
      R(this.add.text(DX+DW/2,DY+220,'← 레시피를 선택하세요',{fontSize:'14px',fill:'#333355',fontFamily:'Arial'}).setOrigin(0.5));
      return;
    }

    const outDef=ITEM_DEFS[recipe.out.id];
    const canCraft=this._canCraft(recipe);
    const pad=20;

    // 출력 아이템
    R(this.add.text(DX+pad,DY+16,'제작 결과',{fontSize:'10px',fill:'#555577',fontFamily:'Arial'}));
    R(this.add.rectangle(DX+pad,DY+28,72,72,0x0a001e).setOrigin(0).setStrokeStyle(2,canCraft?0x2ecc71:0x4a2c6a));
    R(this.add.text(DX+pad+36,DY+62,outDef?.icon||'?',{fontSize:'30px'}).setOrigin(0.5));
    R(this.add.text(DX+pad+82,DY+38,outDef?.label||recipe.id,{fontSize:'16px',fill:'#ffffff',fontFamily:'Arial',fontStyle:'bold'}));
    R(this.add.text(DX+pad+82,DY+60,`× ${recipe.out.qty}개`,{fontSize:'12px',fill:'#aaaaaa',fontFamily:'Arial'}));
    R(this.add.text(DX+pad+82,DY+78,`⏱ ${recipe.time}  ⚡ 에너지 파편 ×${this._craftEnergyCost(recipe)}`,{fontSize:'10px',fill:'#446644',fontFamily:'Arial'}));

    // 재료
    R(this.add.text(DX+pad,DY+110,'필요 재료',{fontSize:'10px',fill:'#555577',fontFamily:'Arial'}));
    R(this.add.rectangle(DX+pad,DY+122,DW-pad*2,1,0x2a1a4a).setOrigin(0));

    recipe.inputs.forEach((inp,i)=>{
      const iy=DY+128+i*46;
      const inDef=ITEM_DEFS[inp.id];
      const have=playerInventory.count(inp.id);
      const ok=have>=inp.qty;
      R(this.add.rectangle(DX+pad,iy,DW-pad*2,42,ok?0x081408:0x140808).setOrigin(0).setStrokeStyle(1,ok?0x2a4a2a:0x3a1a1a));
      R(this.add.text(DX+pad+8,iy+21,inDef?.icon||'?',{fontSize:'22px'}).setOrigin(0,0.5));
      R(this.add.text(DX+pad+38,iy+11,inDef?.label||inp.id,{fontSize:'12px',fill:'#cccccc',fontFamily:'Arial'}));
      R(this.add.text(DX+pad+38,iy+27,`보유: ${have}  /  필요: ${inp.qty}`,{fontSize:'10px',fill:ok?'#66cc66':'#cc6666',fontFamily:'Arial'}));
    });

    const craftY=DY+128+recipe.inputs.length*46+14;
    const cb=R(this.add.rectangle(DX+DW/2,craftY,200,38,canCraft?0x1a4a1a:0x1e1e1e).setOrigin(0.5)
      .setInteractive({useHandCursor:canCraft}).setStrokeStyle(2,canCraft?0x2ecc71:0x333333));
    R(this.add.text(DX+DW/2,craftY,canCraft?'⚗️ 제작하기':'재료 부족',{fontSize:'14px',fill:canCraft?'#2ecc71':'#555555',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));

    if (canCraft) {
      cb.on('pointerover',()=>cb.setFillStyle(0x2a6a2a));
      cb.on('pointerout', ()=>cb.setFillStyle(0x1a4a1a));
      cb.on('pointerdown',()=>this._doCraft(recipe));
    }
  }

  _doCraft(recipe) {
    if (!this._canCraft(recipe)){
      const ec=this._craftEnergyCost(recipe);
      if (playerInventory.count('energy_basic')<ec) this._showHint(`❌ 에너지 파편 ${ec}개 필요!`);
      else this._showHint('❌ 재료 부족!');
      return;
    }
    playerInventory.consume('energy_basic', this._craftEnergyCost(recipe));
    recipe.inputs.forEach(inp=>playerInventory.consume(inp.id,inp.qty));
    playerInventory.add(recipe.out.id,recipe.out.qty);
    const d=ITEM_DEFS[recipe.out.id];
    this._showHint(`✅ ${d?.icon||''} ${d?.label||recipe.out.id} ×${recipe.out.qty} 제작 완료!`);
    this._buildRecipeDetail(recipe);
    this._buildRecipeList();
    if (this.inventoryUI?.visible) this.inventoryUI.refresh();
  }

  _showHint(msg) {
    if (this._hintTimer) this._hintTimer.remove();
    this.hintTxt.setText(msg).setStyle({fill:'#aaffaa'});
    this._hintTimer=this.time.delayedCall(2500,()=>{this.hintTxt.setText('I: 인벤토리  ESC: 기지로').setStyle({fill:'#334433'});});
  }

  update() {
    if (this.goldText) this.goldText.setText(`🪙 ${PLAYER_GOLD}`);
  }
}

// ══════════════════════════════════════════════════════════════
// SmithScene — 대장장이 (장비 제작 + 장착)
// ══════════════════════════════════════════════════════════════
class SmithScene extends Phaser.Scene {
  constructor() { super('SmithScene'); }

  create() {
    this.cameras.main.fadeIn(250);
    this.selectedCat    = '티어1';
    this.selectedRecipe = null;
    this._listObjs      = [];
    this._detailObjs    = [];
    this._equipObjs     = [];

    // ── 배경
    this.add.rectangle(0,0,GAME_WIDTH,GAME_HEIGHT,0x080a06).setOrigin(0);

    // ── 헤더
    this.add.rectangle(0,0,GAME_WIDTH,52,0x0a100a).setOrigin(0);
    this.add.rectangle(0,51,GAME_WIDTH,2,0xe67e22).setOrigin(0);
    this.add.text(GAME_WIDTH/2,26,'⚒️  대장장이',{fontSize:'16px',fill:'#e67e22',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);

    const backBtn=this.add.rectangle(56,26,90,30,0x1a1a0a).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x4a3a1a);
    this.add.text(56,26,'← 마을로',{fontSize:'12px',fill:'#998877',fontFamily:'Arial'}).setOrigin(0.5);
    backBtn.on('pointerdown',()=>{ this.cameras.main.fadeOut(250); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('HubScene')); });

    this.add.rectangle(GAME_WIDTH-4,4,120,22,0x2a2000,0.9).setOrigin(1,0).setStrokeStyle(1,0x888800);
    this.goldText=this.add.text(GAME_WIDTH-8,15,'',{fontSize:'12px',fill:'#f1c40f',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(1,0.5);

    // ── 레이아웃: 좌측 장착 현황(240px) | 중앙 레시피(280px) | 우측 상세(440px)
    const EX=0, LX=240, DX=520;
    const BY=52, BH=GAME_HEIGHT-52;

    this.add.rectangle(EX,BY,240,BH,0x060c06,0.95).setOrigin(0).setStrokeStyle(1,0x1a2a10);
    this.add.rectangle(LX,BY,280,BH,0x08100a,0.95).setOrigin(0).setStrokeStyle(1,0x1a2a15);
    this.add.rectangle(DX,BY,440,BH,0x04080a,0.95).setOrigin(0).setStrokeStyle(1,0x0a1820);

    this.add.text(EX+120,BY+16,'장착 현황',{fontSize:'12px',fill:'#886644',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);

    // 카테고리 탭
    this._catTabBgs={}; this._catTabTxts={};
    ['티어1','티어2'].forEach((cat,i)=>{
      const tx=LX+4+i*134, ty=BY+18;
      const bg=this.add.rectangle(tx,ty,130,26,0x1a1400).setOrigin(0,0.5).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x3a2a0a);
      const txt=this.add.text(tx+65,ty,cat,{fontSize:'12px',fill:'#887755',fontFamily:'Arial'}).setOrigin(0.5);
      bg.on('pointerdown',()=>this._selectCategory(cat));
      this._catTabBgs[cat]=bg; this._catTabTxts[cat]=txt;
    });

    // 인벤토리
    this.inventoryUI=new InventoryUI(this,playerInventory,{title:'🎒 인벤토리',depth:95,y:280});
    this.keyI  =this.input.keyboard.addKey(73);
    this.keyEsc=this.input.keyboard.addKey(27);
    this.keyI.on('down',()=>this.inventoryUI.toggle());
    this.keyEsc.on('down',()=>{
      if (this.inventoryUI.visible){this.inventoryUI.hide();return;}
      this.cameras.main.fadeOut(250);
      this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('HubScene'));
    });

    this.hintTxt=this.add.text(GAME_WIDTH/2,GAME_HEIGHT-14,'I: 인벤토리  ESC: 마을로',{fontSize:'10px',fill:'#334422',fontFamily:'Arial'}).setOrigin(0.5).setDepth(5);

    this._buildEquipSlots();
    this._selectCategory('티어1');
  }

  _buildEquipSlots() {
    this._equipObjs.forEach(o=>{try{o.destroy();}catch(e){}});
    this._equipObjs=[];
    const R=o=>{this._equipObjs.push(o);return o;};
    const EX=10, BY=52+36;
    const slots=['weapon','armor','helmet','shoes','gloves'];
    slots.forEach((slot,i)=>{
      const sy=BY+i*66;
      const equipped=PLAYER_EQUIP[slot];
      const eDef=equipped?ITEM_DEFS[equipped]:null;
      const bg=R(this.add.rectangle(EX,sy,220,60,equipped?0x0a1a0a:0x080808).setOrigin(0).setStrokeStyle(1,equipped?0x2a4a2a:0x1a1a1a));
      R(this.add.text(EX+8,sy+10,SLOT_LABELS[slot],{fontSize:'9px',fill:'#555544',fontFamily:'Arial'}));
      R(this.add.text(EX+8,sy+26,eDef?eDef.icon:'—',{fontSize:'22px'}).setOrigin(0,0));
      R(this.add.text(EX+40,sy+28,eDef?eDef.label:'미장착',{fontSize:'11px',fill:equipped?'#ccffcc':'#444444',fontFamily:'Arial'}));
      if (equipped) {
        const statsStr=[];
        if (eDef.atk)   statsStr.push(`ATK+${eDef.atk}`);
        if (eDef.def)   statsStr.push(`DEF+${eDef.def}`);
        if (eDef.spd)   statsStr.push(`SPD+${eDef.spd}`);
        if (eDef.maxHp) statsStr.push(`HP+${eDef.maxHp}`);
        R(this.add.text(EX+40,sy+44,statsStr.join(' '),{fontSize:'9px',fill:'#88bb88',fontFamily:'Arial'}));
        // 해제 버튼
        const ub=R(this.add.rectangle(EX+180,sy+30,36,22,0x3a1a1a).setOrigin(0.5).setInteractive({useHandCursor:true}).setStrokeStyle(1,0xcc4444));
        R(this.add.text(EX+180,sy+30,'해제',{fontSize:'9px',fill:'#cc4444',fontFamily:'Arial'}).setOrigin(0.5));
        ub.on('pointerdown',()=>{ unequipItem(slot); this._buildEquipSlots(); this._buildRecipeList(); this._buildRecipeDetail(this.selectedRecipe); if(this.inventoryUI?.visible)this.inventoryUI.refresh(); this._showHint(`${SLOT_LABELS[slot]} 해제`); });
      }
    });
    // 스탯 요약
    const ps=PLAYER_STATS;
    const sy=BY+slots.length*66+10;
    R(this.add.rectangle(EX,sy,220,60,0x0a0a0a).setOrigin(0).setStrokeStyle(1,0x2a2a1a));
    R(this.add.text(EX+8,sy+8,'현재 스탯',{fontSize:'9px',fill:'#555544',fontFamily:'Arial'}));
    R(this.add.text(EX+8,sy+22,`ATK:${ps.atk}  DEF:${ps.def}`,{fontSize:'11px',fill:'#ccbbaa',fontFamily:'Arial'}));
    R(this.add.text(EX+8,sy+38,`SPD:${ps.spd}  MaxHP:${ps.maxHp}`,{fontSize:'11px',fill:'#ccbbaa',fontFamily:'Arial'}));
  }

  _selectCategory(cat) {
    this.selectedCat=cat; this.selectedRecipe=null;
    Object.entries(this._catTabBgs).forEach(([c,bg])=>{
      bg.setFillStyle(c===cat?0x2a1a00:0x1a1400).setStrokeStyle(1,c===cat?0xe67e22:0x3a2a0a);
      this._catTabTxts[c].setStyle({fill:c===cat?'#e67e22':'#887755'});
    });
    this._buildRecipeList();
    this._buildRecipeDetail(null);
  }

  _smithEnergyCost(recipe){ return recipe.cat==='티어2' ? 10 : 5; }
  _canCraft(recipe){ return recipe.inputs.every(inp=>playerInventory.count(inp.id)>=inp.qty) && playerInventory.count('energy_basic')>=this._smithEnergyCost(recipe); }

  _buildRecipeList() {
    this._listObjs.forEach(o=>{try{o.destroy();}catch(e){}});
    this._listObjs=[];
    const R=o=>{this._listObjs.push(o);return o;};
    const recipes=SMITH_RECIPES.filter(r=>r.cat===this.selectedCat);
    const LX=244, LY=52+36, IH=48, IW=272;

    recipes.forEach((recipe,i)=>{
      const ry=LY+i*IH;
      const canCraft=this._canCraft(recipe);
      const isSelected=this.selectedRecipe?.id===recipe.id;
      const outDef=ITEM_DEFS[recipe.out.id];
      const isEquipped=Object.values(PLAYER_EQUIP).includes(recipe.out.id);

      const bg=R(this.add.rectangle(LX,ry,IW,IH-2,isSelected?0x1a1400:(canCraft?0x0e140a:0x100a08)).setOrigin(0)
        .setInteractive({useHandCursor:true})
        .setStrokeStyle(1,isSelected?0xe67e22:(canCraft?0x2a4a1a:0x2a1a0a)));
      R(this.add.text(LX+10,ry+IH/2,outDef?.icon||'?',{fontSize:'20px'}).setOrigin(0,0.5));
      R(this.add.text(LX+40,ry+12,recipe.label,{fontSize:'12px',fill:canCraft?'#cceeaa':'#bbbbaa',fontFamily:'Arial'}));
      R(this.add.text(LX+40,ry+28,isEquipped?'★ 장착중':`즉시 제작  ⚡×${this._smithEnergyCost(recipe)}`,{fontSize:'9px',fill:isEquipped?'#ffcc44':'#556644',fontFamily:'Arial'}));

      bg.on('pointerover',()=>{if(!isSelected) bg.setFillStyle(canCraft?0x182210:0x18100a);});
      bg.on('pointerout', ()=>{if(!isSelected) bg.setFillStyle(canCraft?0x0e140a:0x100a08);});
      bg.on('pointerdown',()=>this._selectRecipe(recipe));
    });
  }

  _selectRecipe(recipe) {
    this.selectedRecipe=recipe;
    this._buildRecipeList();
    this._buildRecipeDetail(recipe);
  }

  _buildRecipeDetail(recipe) {
    this._detailObjs.forEach(o=>{try{o.destroy();}catch(e){}});
    this._detailObjs=[];
    const R=o=>{this._detailObjs.push(o);return o;};
    const DX=524, DY=52, DW=432, pad=18;

    if (!recipe){
      R(this.add.text(DX+DW/2,DY+220,'← 장비를 선택하세요',{fontSize:'14px',fill:'#333322',fontFamily:'Arial'}).setOrigin(0.5));
      return;
    }

    const outDef=ITEM_DEFS[recipe.out.id];
    const canCraft=this._canCraft(recipe);
    const alreadyOwned=playerInventory.count(recipe.out.id)>0;
    const isEquipped=PLAYER_EQUIP[outDef?.slot]===recipe.out.id;

    R(this.add.text(DX+pad,DY+16,'제작 결과',{fontSize:'10px',fill:'#665533',fontFamily:'Arial'}));
    R(this.add.rectangle(DX+pad,DY+28,72,72,0x0a0c06).setOrigin(0).setStrokeStyle(2,canCraft?0xe67e22:0x4a3a1a));
    R(this.add.text(DX+pad+36,DY+62,outDef?.icon||'?',{fontSize:'30px'}).setOrigin(0.5));
    R(this.add.text(DX+pad+82,DY+36,outDef?.label||recipe.id,{fontSize:'16px',fill:'#ffffff',fontFamily:'Arial',fontStyle:'bold'}));

    // 스탯 표시
    const statLines=[];
    if (outDef?.atk)   statLines.push(`⚔️ ATK +${outDef.atk}`);
    if (outDef?.def)   statLines.push(`🛡️ DEF +${outDef.def}`);
    if (outDef?.spd)   statLines.push(`👟 SPD +${outDef.spd}`);
    if (outDef?.maxHp) statLines.push(`❤️ MaxHP +${outDef.maxHp}`);
    R(this.add.text(DX+pad+82,DY+56,statLines.join('  '),{fontSize:'10px',fill:'#88cc88',fontFamily:'Arial'}));
    R(this.add.text(DX+pad+82,DY+74,`즉시 제작  ⚡ 에너지 파편 ×${this._smithEnergyCost(recipe)}`,{fontSize:'9px',fill:'#556644',fontFamily:'Arial'}));

    R(this.add.text(DX+pad,DY+110,'필요 재료',{fontSize:'10px',fill:'#665533',fontFamily:'Arial'}));
    R(this.add.rectangle(DX+pad,DY+122,DW-pad*2,1,0x2a2a1a).setOrigin(0));

    recipe.inputs.forEach((inp,i)=>{
      const iy=DY+128+i*46;
      const inDef=ITEM_DEFS[inp.id];
      const have=playerInventory.count(inp.id);
      const ok=have>=inp.qty;
      R(this.add.rectangle(DX+pad,iy,DW-pad*2,42,ok?0x081008:0x140808).setOrigin(0).setStrokeStyle(1,ok?0x2a3a1a:0x3a1a1a));
      R(this.add.text(DX+pad+8,iy+21,inDef?.icon||'?',{fontSize:'20px'}).setOrigin(0,0.5));
      R(this.add.text(DX+pad+36,iy+11,inDef?.label||inp.id,{fontSize:'12px',fill:'#cccccc',fontFamily:'Arial'}));
      R(this.add.text(DX+pad+36,iy+27,`보유: ${have}  /  필요: ${inp.qty}`,{fontSize:'10px',fill:ok?'#66cc66':'#cc6666',fontFamily:'Arial'}));
    });

    const btnY=DY+128+recipe.inputs.length*46+14;

    // 제작 버튼
    const cb=R(this.add.rectangle(DX+pad+90,btnY,160,36,canCraft?0x1a3010:0x1e1e1e).setOrigin(0.5)
      .setInteractive({useHandCursor:canCraft}).setStrokeStyle(2,canCraft?0xe67e22:0x333333));
    R(this.add.text(DX+pad+90,btnY,canCraft?'⚒️ 제작하기':'재료 부족',{fontSize:'13px',fill:canCraft?'#e67e22':'#555555',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
    if (canCraft){
      cb.on('pointerover',()=>cb.setFillStyle(0x2a4a18));
      cb.on('pointerout', ()=>cb.setFillStyle(0x1a3010));
      cb.on('pointerdown',()=>this._doCraft(recipe));
    }

    // 장착 버튼 (인벤토리에 있을 때)
    if (alreadyOwned && !isEquipped && outDef?.isEquip) {
      const eb=R(this.add.rectangle(DX+DW-pad-80,btnY,150,36,0x103030).setOrigin(0.5)
        .setInteractive({useHandCursor:true}).setStrokeStyle(2,0x27ae60));
      R(this.add.text(DX+DW-pad-80,btnY,'✅ 장착하기',{fontSize:'13px',fill:'#2ecc71',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
      eb.on('pointerover',()=>eb.setFillStyle(0x184a30));
      eb.on('pointerout', ()=>eb.setFillStyle(0x103030));
      eb.on('pointerdown',()=>{
        if (equipItem(recipe.out.id)){
          this._showHint(`✅ ${outDef.label} 장착!`);
          this._buildEquipSlots(); this._buildRecipeList(); this._buildRecipeDetail(recipe);
          if(this.inventoryUI?.visible)this.inventoryUI.refresh();
        }
      });
    }
    if (isEquipped){
      R(this.add.text(DX+DW-pad-80,btnY,'★ 장착 중',{fontSize:'13px',fill:'#ffcc44',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
    }
  }

  _doCraft(recipe) {
    if (!this._canCraft(recipe)){
      const ec=this._smithEnergyCost(recipe);
      if (playerInventory.count('energy_basic')<ec) this._showHint(`❌ 에너지 파편 ${ec}개 필요!`);
      else this._showHint('❌ 재료 부족!');
      return;
    }
    playerInventory.consume('energy_basic', this._smithEnergyCost(recipe));
    recipe.inputs.forEach(inp=>playerInventory.consume(inp.id,inp.qty));
    playerInventory.add(recipe.out.id,recipe.out.qty);
    const d=ITEM_DEFS[recipe.out.id];
    this._showHint(`✅ ${d?.icon||''} ${d?.label||recipe.out.id} 제작 완료!`);
    this._buildEquipSlots();
    this._buildRecipeList();
    this._buildRecipeDetail(recipe);
    if (this.inventoryUI?.visible) this.inventoryUI.refresh();
  }

  _showHint(msg){
    if(this._hintTimer)this._hintTimer.remove();
    this.hintTxt.setText(msg).setStyle({fill:'#aaffaa'});
    this._hintTimer=this.time.delayedCall(2500,()=>{this.hintTxt.setText('I: 인벤토리  ESC: 기지로').setStyle({fill:'#334422'});});
  }

  update(){ if(this.goldText)this.goldText.setText(`🪙 ${PLAYER_GOLD}`); }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d0020',
  parent: 'game-container',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, HubScene, BaseScene, StageSelectScene, FieldScene, CraftScene, SmithScene]
};
const game = new Phaser.Game(config);
