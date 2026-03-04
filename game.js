// ================================
// 아르카나 팩토리 - Phase 1
// 탑뷰 마을 + 기지 그리드 시스템
// ================================

const GAME_WIDTH  = 960;
const GAME_HEIGHT = 540;

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
  miner:    { label: '채굴기',      color: 0x4a2c8a, icon: '⛏️', baseW: 4, baseH: 2, resource: 'mineral', rate: 1,  isPipe: false, isEnergyStorage: false, isWarehouse: false },
  refinery: { label: '정제기',      color: 0x1a4a6a, icon: '🔧', baseW: 4, baseH: 2, resource: 'mineral', rate: 0,  isPipe: false, isEnergyStorage: false, isWarehouse: false },
  estore:   { label: '에너지저장고', color: 0x7a4a00, icon: '🔋', baseW: 4, baseH: 2, resource: '',        rate: 0,  isPipe: false, isEnergyStorage: true,  isWarehouse: false },
  warehouse:{ label: '창고',         color: 0x2a4a6a, icon: '📦', baseW: 4, baseH: 2, resource: '',        rate: 0,  isPipe: false, isEnergyStorage: false, isWarehouse: true  },
  pipe:     { label: '파이프',        color: 0x1a3a2a, icon: '🔗', baseW: 1, baseH: 1, resource: '',        rate: 0,  isPipe: true,  isEnergyStorage: false, isWarehouse: false },
};

const ESTORE_UPGRADES = [
  { level: 1, slots: 1,  slotSize: 100, label: 'Lv.1',     upgradeCost: 50  },
  { level: 2, slots: 2,  slotSize: 100, label: 'Lv.2',     upgradeCost: 150 },
  { level: 3, slots: 3,  slotSize: 100, label: 'Lv.3',     upgradeCost: 300 },
  { level: 4, slots: 5,  slotSize: 200, label: 'Lv.4',     upgradeCost: 600 },
  { level: 5, slots: 10, slotSize: 500, label: 'Lv.5 MAX', upgradeCost: null },
];

const INV_COLS = 10;
const INV_ROWS = 3;
const INV_MAX  = 100;

const ITEM_DEFS = {
  mineral:      { label: '광물',       icon: '⛏️', color: 0x9b59b6, bg: 0x2a1a4a },
  energy_basic: { label: '에너지 파편', icon: '⚡', color: 0xf1c40f, bg: 0x3a3000 },
  energy_mid:   { label: '압축 에너지', icon: '🔆', color: 0xe67e22, bg: 0x3a2000 },
  energy_high:  { label: '순수 에너지', icon: '💠', color: 0x3498db, bg: 0x001a3a },
  gold:         { label: '골드',        icon: '🪙', color: 0xf1c40f, bg: 0x3a3000 },
  potion:       { label: '포션',        icon: '🧪', color: 0x2ecc71, bg: 0x003a1a },
};

// 글로벌 기지 상태 저장소 (마을 이동 시 유지용)
const BASE_DATA = { initialized: false, grid: null, buildings: [], pipes: [] };

// 아이템 분할 글로벌 모드 (ALL, HALF, ONE)
let GLOBAL_SPLIT_MODE = 'ALL';
const SPLIT_LABELS = { 'ALL': '전체', 'HALF': '절반', 'ONE': '1개' };

let isGameInitialized = false;

// ── 인벤토리 시스템 (이동 & 드래그앤드롭 로직 추가) ──
class Inventory {
  constructor(size = 30) {
    this.maxStack = INV_MAX;
    this.slots = Array.from({ length: size }, () => ({ itemId: null, count: 0 }));
  }
  add(itemId, amount = 1) {
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

class InventoryUI {
  constructor(scene, inv, options = {}) {
    this.scene = scene; this.inv = inv;
    this.title = options.title || '🎒 인벤토리';
    this.depth = options.depth || 95;
    this.onClose = options.onClose || null;
    this.cols = options.cols || Math.min(10, this.inv.slots.length);
    this.rows = options.rows || Math.ceil(this.inv.slots.length / this.cols);

    const SLOT = 46; const PAD = 8;
    this.pw = PAD*2 + SLOT*this.cols + (this.cols-1)*4;
    this.ph = 54 + PAD*2 + SLOT*this.rows + (this.rows-1)*4 + 12;
    this.ox = options.x !== undefined ? options.x : Math.floor((GAME_WIDTH - this.pw) / 2);
    this.oy = options.y !== undefined ? options.y : Math.floor((GAME_HEIGHT - this.ph) / 2);

    this.container = scene.add.container(this.ox, this.oy).setDepth(this.depth).setVisible(false);
    this.slotGfxList = []; this.slotTexts = [];
    this._build();
  }

  _build() {
    const { scene, pw, ph } = this;
    const c = this.container;

    c.add(scene.add.rectangle(0, 0, pw, ph, 0x0a0015, 0.97).setOrigin(0).setStrokeStyle(2, 0x6c3483));
    c.add(scene.add.text(pw/2, 18, this.title, { fontSize:'15px', fill:'#c39bd3', fontFamily:'Arial', fontStyle:'bold' }).setOrigin(0.5));

    // 나누기 모드 버튼
    const modeBtn = scene.add.text(pw-46, 16, `이동: ${SPLIT_LABELS[GLOBAL_SPLIT_MODE]}`, {
      fontSize:'10px', fill:'#f1c40f', backgroundColor:'#3a1a2a', padding:{x:4,y:2}
    }).setOrigin(1,0.5).setInteractive({useHandCursor:true});
    modeBtn.on('pointerdown', () => {
      GLOBAL_SPLIT_MODE = GLOBAL_SPLIT_MODE === 'ALL' ? 'HALF' : (GLOBAL_SPLIT_MODE === 'HALF' ? 'ONE' : 'ALL');
      scene.events.emit('updateSplitMode');
    });
    scene.events.on('updateSplitMode', () => { if(modeBtn.active) modeBtn.setText(`이동: ${SPLIT_LABELS[GLOBAL_SPLIT_MODE]}`); });
    c.add(modeBtn);

    const closeBtn = scene.add.rectangle(pw-16, 16, 24, 24, 0x3a1a2a).setInteractive({ useHandCursor: true });
    c.add([closeBtn, scene.add.text(pw-16, 16, '✕', { fontSize:'12px', fill:'#cc4444', fontFamily:'Arial' }).setOrigin(0.5)]);
    closeBtn.on('pointerdown', () => this.hide());

    for (let i = 0; i < this.inv.slots.length; i++) {
      const r = Math.floor(i / this.cols), col = i % this.cols;
      const sx = 8 + col*(50), sy = 40 + r*(50);

      const slotBg = scene.add.rectangle(sx, sy, 46, 46, 0x1a0a2a).setOrigin(0).setStrokeStyle(1, 0x4a2c6a);
      slotBg.setInteractive({ dropZone: true });
      slotBg.inv = this.inv; slotBg.slotIdx = i;
      slotBg.isEnergyStorage = this.title.includes('에너지저장고');
      c.add(slotBg); this.slotGfxList.push(slotBg);

      const iconTxt = scene.add.text(sx+23, sy+15, '', { fontSize: '20px', fontFamily: 'Arial' }).setOrigin(0.5);
      iconTxt.setInteractive({ draggable: true });
      iconTxt.inv = this.inv; iconTxt.slotIdx = i;

      const cntTxt  = scene.add.text(sx+42, sy+42, '', { fontSize:'10px', fill:'#f1c40f', fontFamily:'Arial', fontStyle:'bold' }).setOrigin(1, 1);
      c.add([iconTxt, cntTxt]); this.slotTexts.push({ icon: iconTxt, count: cntTxt });
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
        if(scene.storageUI) scene.storageUI.refresh();
        if(scene.buildingUI) scene.buildingUI.refresh();
      });
      scene._dragSetupDone = true;
    }
  }

  refresh() {
    for (let i = 0; i < this.inv.slots.length; i++) {
      const slot = this.inv.slots[i];
      const { icon, count } = this.slotTexts[i];
      if (slot && slot.itemId) {
        const def = ITEM_DEFS[slot.itemId];
        icon.setText(def ? def.icon : '?');
        count.setText(slot.count >= this.inv.maxStack ? 'MAX' : String(slot.count));
        this.slotGfxList[i].setFillStyle(def ? def.bg : 0x1a0a2a);
      } else {
        icon.setText(''); count.setText(''); this.slotGfxList[i].setFillStyle(0x1a0a2a);
      }
    }
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
      playerInventory.add('energy_basic', 100);
      isGameInitialized = true;
    }
    this.add.rectangle(0, 50, GAME_WIDTH, GAME_HEIGHT - 50, 0x1a3a1a).setOrigin(0);
    for (let x = 0; x < GAME_WIDTH; x += 40)
      for (let y = 50; y < GAME_HEIGHT; y += 40)
        if ((Math.floor(x/40)+Math.floor((y-50)/40)) % 2 === 0)
          this.add.rectangle(x, y, 40, 40, 0x1e421e).setOrigin(0);

    this.baseZone    = this._createBuilding(160, 280, '🏗️', '기지',    0x1a4a2e, 0x2ecc71, '기지로 이동',     'BaseScene');
    this.fieldZone   = this._createBuilding(800, 280, '🌲', '필드',    0x4a1a1a, 0xe74c3c, '필드로 이동',     'FieldScene');
    this.craftZone   = this._createBuilding(480, 130, '⚗️', '제작소',  0x1a1a4a, 0x3498db, '제작소로 이동',   'CraftScene');
    this.storageZone = this._createBuilding(480, 390, '📦', '마을창고', 0x1a3a4a, 0xf1c40f, '[E] 창고 열기',   null);

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
  }

  _buildHUD() {
    this.add.rectangle(0, 0, GAME_WIDTH, 50, 0x0a0015).setOrigin(0).setDepth(10);
    this.add.rectangle(0, 49, GAME_WIDTH, 2, 0x6c3483).setOrigin(0).setDepth(10);
    this.add.text(16, 14, '⚔️ Lv.1  모험가', { fontSize: '15px', fill: '#c39bd3', fontFamily: 'Arial' }).setDepth(10);
    this.add.text(GAME_WIDTH-250, 14, 'WASD:이동  E:창고  I:인벤토리', { fontSize: '10px', fill: '#445544', fontFamily: 'Arial' }).setDepth(10);
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
    const zones = [ { zone: this.baseZone, scene: 'BaseScene' }, { zone: this.fieldZone, scene: 'FieldScene' }, { zone: this.craftZone, scene: 'CraftScene' } ];
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

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a100a).setOrigin(0);
    this.gridGfx = this.add.graphics().setDepth(1);
    this.pipeLineGfx = this.add.graphics().setDepth(7);

    // 기지 상태 복원 로직 (마을 복귀 시 건물 유지)
    if (!BASE_DATA.initialized) {
      this.grid = Array.from({ length: GRID_COLS }, () => Array(GRID_ROWS).fill(null));
      this.buildings = []; this.pipes = [];
      BASE_DATA.grid = this.grid; BASE_DATA.buildings = this.buildings; BASE_DATA.pipes = this.pipes;
      BASE_DATA.initialized = true;
    } else {
      this.grid = BASE_DATA.grid; this.buildings = BASE_DATA.buildings; this.pipes = BASE_DATA.pipes;
      this.buildings.forEach(b => {
        const def = BUILDING_DEFS[b.type], bx = GRID_OFFSET_X + b.col*TILE, by = GRID_OFFSET_Y + b.row*TILE, w = b.w, h = b.h;
        b.gfx = [
          this.add.rectangle(bx,by,w*TILE,h*TILE,def.color).setOrigin(0).setDepth(10).setStrokeStyle(2,0x9b59b6),
          this.add.text(bx+(w*TILE)/2,by+(h*TILE)/2-8,def.icon,{fontSize:'20px'}).setOrigin(0.5).setDepth(11),
          this.add.text(bx+(w*TILE)/2,by+(h*TILE)/2+10,def.label,{fontSize:'10px',fill:'#ffffff',fontFamily:'Arial'}).setOrigin(0.5).setDepth(11)
        ];
      });
      this.pipes.forEach(p => {
        p.gfx = this.add.graphics().setDepth(9);
        p.gfx.fillStyle(0x1a3a2a,1).fillRect(GRID_OFFSET_X+p.col*TILE+4, GRID_OFFSET_Y+p.row*TILE+4, TILE-8, TILE-8);
      });
    }

    this._redrawGrid(); this._redrawPipeLines();

    this.player = this.add.rectangle(this.px, this.py, 24, 24, 0xf0e6ff).setDepth(20);
    this.playerDir = this.add.triangle(this.px, this.py-16, 0,8, 8,-8, -8,-8, 0xc39bd3).setDepth(21);

    this._buildHUD(); this._buildBuildPanel(); this._buildPopup();

    this.interactPrompt = this.add.text(0,0,'[E]',{ fontSize:'11px',fill:'#ffffff',fontFamily:'Arial',backgroundColor:'#00000099',padding:{x:5,y:2} }).setOrigin(0.5,1).setDepth(40).setVisible(false);
    this.inventoryUI = new InventoryUI(this, playerInventory, { title: '🎒 인벤토리', depth: 95 });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({ W: 87, A: 65, S: 83, D: 68 });
    this.keyE = this.input.keyboard.addKey(69);
    this.keyR = this.input.keyboard.addKey(82); this.keyI = this.input.keyboard.addKey(73);
    this.keySp = this.input.keyboard.addKey(32); this.keyEsc = this.input.keyboard.addKey(27);

    // 상호작용 및 건설 모두 E키로 통합
    this.keyE.on('down', () => {
      if (this.nearbyBuilding) {
        if (this.nearbyBuilding.type === 'pipe') this._openPipePopup(this.nearbyBuilding.id);
        else this._openPopup(this.nearbyBuilding.id);
      } else if (!this.popupVisible && !this.inventoryUI.visible) {
        this.buildPanel.visible ? this.buildPanel.setVisible(false) : this.buildPanel.setVisible(true);
      }
    });

    this.keyR.on('down', () => { if (this.buildMode && !BUILDING_DEFS[this.buildType].isPipe) { this.ghostRot = !this.ghostRot; this._updateGhost(); } });
    this.keyI.on('down', () => { this._closePopup(); this.inventoryUI.container.setY(this.inventoryUI.oy); this.inventoryUI.toggle(); });
    this.keySp.on('down', () => { if (this.buildMode) this._confirmPlace(); });
    this.keyEsc.on('down', () => {
      if (this.buildingUI?.visible) { this.buildingUI.hide(); return; }
      if (this.inventoryUI.visible) { this.inventoryUI.hide(); return; }
      if (this.popupVisible)        { this._closePopup(); return; }
      if (this.buildMode)           { this._cancelBuild(); return; }
      if (this.buildPanel.visible)  { this.buildPanel.setVisible(false); return; }
      this.scene.start('HubScene');
    });

    this.joystick = new VirtualJoystick(this, 80, 490);
    this.time.addEvent({ delay: 1000, loop: true, callback: this._tickProduction, callbackScope: this });
  }

  _redrawGrid() {
    this.gridGfx.clear();
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const x = GRID_OFFSET_X+c*TILE, y = GRID_OFFSET_Y+r*TILE;
        const occ = this.grid[c][r] !== null;
        this.gridGfx.fillStyle(occ ? 0x1a2a1a : 0x0f1a0f, 1);
        this.gridGfx.fillRect(x+1, y+1, TILE-2, TILE-2);
        this.gridGfx.lineStyle(1, occ ? 0x2a4a2a : 0x1a2a1a, 0.8);
        this.gridGfx.strokeRect(x, y, TILE, TILE);
      }
    }
  }

  _buildHUD() {
    this.add.rectangle(0, 0, GAME_WIDTH, 50, 0x0a0015).setOrigin(0).setDepth(50);
    this.add.rectangle(0, 49, GAME_WIDTH, 2, 0x2ecc71).setOrigin(0).setDepth(50);
    this.add.text(12, 14, '🏗️ 기지', { fontSize:'15px', fill:'#2ecc71', fontFamily:'Arial', fontStyle:'bold' }).setDepth(50);
    this.hudStatus = this.add.text(150, 14, '⚡ 에너지 확인중', { fontSize:'13px', fill:'#f1c40f', fontFamily:'Arial' }).setDepth(50);
    this.add.text(420, 14, 'E:상호작용/건물  R:회전  I:인벤토리  Space:설치', { fontSize:'10px', fill:'#445544', fontFamily:'Arial' }).setDepth(50);
    const backBtn = this.add.rectangle(910, 25, 80, 30, 0x2c3e50).setInteractive({ useHandCursor:true }).setDepth(50);
    this.add.text(910, 25, '← 마을', { fontSize:'12px', fill:'#aaaaaa', fontFamily:'Arial' }).setOrigin(0.5).setDepth(51);
    backBtn.on('pointerdown', () => this.scene.start('HubScene'));
    this._updateHUD();
  }

  _updateHUD() {
    const estores = this.buildings.filter(b => BUILDING_DEFS[b.type].isEnergyStorage);
    let used = 0, total = 0;
    estores.forEach(b => { total += b.storage.slots.length; used += b.storage.slots.filter(sl => sl.itemId !== null).length; });
    const hasEnergy = used > 0;
    this.hudStatus.setText(hasEnergy ? `⚡ ${used}/${total} 슬롯` : `⚡ 에너지 없음 ⚠️`).setStyle({ fill: hasEnergy ? '#f1c40f' : '#e74c3c' });
  }

  _buildBuildPanel() {
    const pw=290, ph=310, px=GAME_WIDTH/2-pw/2, py=GAME_HEIGHT/2-ph/2;
    this.buildPanel = this.add.container(0,0).setDepth(80).setVisible(false);
    this.buildPanel.add(this.add.rectangle(px,py,pw,ph,0x0a0015,0.97).setOrigin(0).setStrokeStyle(2,0x6c3483));
    this.buildPanel.add(this.add.text(px+pw/2,py+16,'🏗️ 건물 선택 (R:회전)',{fontSize:'13px',fill:'#c39bd3',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5));
    ['miner','refinery','estore','warehouse','pipe'].forEach((type,i)=>{
      const def=BUILDING_DEFS[type], bx=px+16, by=py+44+i*50;
      const btn=this.add.rectangle(bx+128,by+18,250,36,0x1a0a2a).setOrigin(0.5).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x4a2c6a);
      const lbl=this.add.text(bx+10,by+18,`${def.icon} ${def.label} [${def.isPipe?'1×1':def.baseW+'×'+def.baseH}]`,{fontSize:'12px',fill:'#ffffff',fontFamily:'Arial'}).setOrigin(0,0.5);
      btn.on('pointerdown',()=>{ this.ghostRot=false; this.buildMode=true; this.buildType=type; this.buildPanel.setVisible(false); });
      this.buildPanel.add([btn,lbl]);
    });
  }

  _buildPopup() {
    const pw=280, ph=290;
    this.popupContainer = this.add.container(0,0).setDepth(90).setVisible(false);
    this.popupContainer.add(this.add.rectangle(0,0,pw,ph,0x0a0015,0.97).setOrigin(0).setStrokeStyle(2,0x9b59b6));
    this.popupTitle = this.add.text(pw/2,18,'',{fontSize:'14px',fill:'#c39bd3',fontFamily:'Arial',fontStyle:'bold'}).setOrigin(0.5);
    this.popupInfo1 = this.add.text(14,42,'',{fontSize:'12px',fill:'#888888',fontFamily:'Arial'});
    this.popupInfo2 = this.add.text(14,60,'',{fontSize:'12px',fill:'#aaaaaa',fontFamily:'Arial'});
    this.popupInfo3 = this.add.text(14,78,'',{fontSize:'11px',fill:'#2ecc71',fontFamily:'Arial'});

    this.popupRunBtn = this.add.rectangle(pw/2,114,220,30,0x2a6a2a).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x2ecc71);
    this.popupRunLbl = this.add.text(pw/2,114,'▶ 수동 가동 (+5)',{fontSize:'12px',fill:'#2ecc71',fontFamily:'Arial'}).setOrigin(0.5);
    this.popupRunBtn.on('pointerdown',()=>this._manualRun());

    this.popupUpgrBtn = this.add.rectangle(pw/2,188,220,30,0x2a3a6a).setInteractive({useHandCursor:true}).setStrokeStyle(1,0x3498db);
    this.popupUpgrLbl = this.add.text(pw/2,188,'⬆️ 업그레이드',{fontSize:'12px',fill:'#3498db',fontFamily:'Arial'}).setOrigin(0.5);
    this.popupUpgrBtn.on('pointerdown',()=>this._upgradeEstore());

    const delBtn = this.add.rectangle(pw/2,236,220,28,0x6a1a1a).setInteractive({useHandCursor:true}).setStrokeStyle(1,0xe74c3c);
    const delLbl = this.add.text(pw/2,236,'🗑 철거',{fontSize:'12px',fill:'#e74c3c',fontFamily:'Arial'}).setOrigin(0.5);
    delBtn.on('pointerdown',()=>this._demolishBuilding());

    const closeBtn = this.add.rectangle(pw-16,16,22,22,0x3a1a2a).setInteractive({useHandCursor:true});
    closeBtn.on('pointerdown',()=>this._closePopup());

    this.popupContainer.add([this.popupTitle, this.popupInfo1, this.popupInfo2, this.popupInfo3, this.popupRunBtn, this.popupRunLbl, this.popupUpgrBtn, this.popupUpgrLbl, delBtn, delLbl, closeBtn]);
  }

  _updateGhost() {
    if (!this.buildMode) return;
    const def = BUILDING_DEFS[this.buildType];
    const w = def.isPipe ? 1 : (this.ghostRot ? def.baseH : def.baseW);
    const h = def.isPipe ? 1 : (this.ghostRot ? def.baseW : def.baseH);
    const mx = this.input.activePointer.x, my = this.input.activePointer.y;
    let gc = Math.floor((mx-GRID_OFFSET_X)/TILE), gr = Math.floor((my-GRID_OFFSET_Y)/TILE);
    this.ghostCol = Phaser.Math.Clamp(gc, 0, GRID_COLS-w); this.ghostRow = Phaser.Math.Clamp(gr, 0, GRID_ROWS-h);

    while(this.ghostTiles.length < w*h) this.ghostTiles.push(this.add.rectangle(0,0,TILE-2,TILE-2,0x2ecc71,0.4).setDepth(30));
    while(this.ghostTiles.length > w*h) this.ghostTiles.pop().destroy();

    let valid = true;
    for(let dc=0; dc<w; dc++) for(let dr=0; dr<h; dr++) {
      if(this.grid[this.ghostCol+dc] && this.grid[this.ghostCol+dc][this.ghostRow+dr] !== null) valid = false;
    }

    let i=0;
    for(let dc=0; dc<w; dc++) for(let dr=0; dr<h; dr++) {
      this.ghostTiles[i].setPosition(GRID_OFFSET_X+(this.ghostCol+dc)*TILE+TILE/2, GRID_OFFSET_Y+(this.ghostRow+dr)*TILE+TILE/2).setVisible(true).setFillStyle(valid?0x2ecc71:0xe74c3c,0.4);
      i++;
    }
  }

  _cancelBuild() { this.buildMode = false; this.ghostTiles.forEach(t=>t.destroy()); this.ghostTiles = []; }

  _confirmPlace() {
    const type = this.buildType, def = BUILDING_DEFS[type];
    const w = def.isPipe ? 1 : (this.ghostRot ? def.baseH : def.baseW);
    const h = def.isPipe ? 1 : (this.ghostRot ? def.baseW : def.baseH);
    const col = this.ghostCol, row = this.ghostRow;

    for(let dc=0; dc<w; dc++) for(let dr=0; dr<h; dr++) {
      if(this.grid[col+dc][row+dr] !== null) { this._showHint('❌ 배치 불가!'); return; }
    }
    const gCX=GRID_OFFSET_X+(col+w/2)*TILE, gCY=GRID_OFFSET_Y+(row+h/2)*TILE;
    if (Phaser.Math.Distance.Between(this.px,this.py,gCX,gCY) > TILE*(def.isPipe?4:5)) { this._showHint('❌ 캐릭터 근처에서만!'); return; }

    const id = Date.now()+Math.random();
    for(let dc=0; dc<w; dc++) for(let dr=0; dr<h; dr++) this.grid[col+dc][row+dr] = {type, id};

    if (def.isPipe) {
      const pg = this.add.graphics().setDepth(9);
      pg.fillStyle(0x1a3a2a,1).fillRect(GRID_OFFSET_X+col*TILE+4,GRID_OFFSET_Y+row*TILE+4,TILE-8,TILE-8);
      this.pipes.push({id,col,row,gfx:pg});
      this._redrawPipeLines();
    } else {
      const bx=GRID_OFFSET_X+col*TILE, by=GRID_OFFSET_Y+row*TILE;
      const bg2=this.add.rectangle(bx,by,w*TILE,h*TILE,def.color).setOrigin(0).setDepth(10).setStrokeStyle(2,0x9b59b6);
      const icon=this.add.text(bx+(w*TILE)/2,by+(h*TILE)/2-8,def.icon,{fontSize:'20px'}).setOrigin(0.5).setDepth(11);
      const lbl=this.add.text(bx+(w*TILE)/2,by+(h*TILE)/2+10,def.label,{fontSize:'10px',fill:'#ffffff',fontFamily:'Arial'}).setOrigin(0.5).setDepth(11);

      let storage = null;
      if (def.isWarehouse) { storage = new ItemStorage(def.label, 30); }
      else if (def.isEnergyStorage) { storage = new ItemStorage('에너지저장고', ESTORE_UPGRADES[0].slots, ESTORE_UPGRADES[0].slotSize); }
      else if (def.resource === 'mineral') { storage = new ItemStorage('채굴기 내부', 1, 100); }

      this.buildings.push({id, type, col, row, w, h, gfx:[bg2,icon,lbl], level:1, storage});
      this._cancelBuild(); this._redrawGrid();
    }
  }

  _calcPipeEnergyCost() { return Math.floor(this.pipes.length/3); }

  _redrawPipeLines() {
    this.pipeLineGfx.clear();
    this.pipes.forEach(p=>{
      const cx=GRID_OFFSET_X+p.col*TILE+TILE/2, cy=GRID_OFFSET_Y+p.row*TILE+TILE/2;
      [{dc:1,dr:0},{dc:-1,dr:0},{dc:0,dr:1},{dc:0,dr:-1}].forEach(({dc,dr})=>{
        const nc=p.col+dc, nr=p.row+dr;
        if(nc<0||nr<0||nc>=GRID_COLS||nr>=GRID_ROWS) return;
        const cell=this.grid[nc][nr]; if(!cell) return;
        if(BUILDING_DEFS[cell.type]?.isPipe) {
          const np=this.pipes.find(pp=>pp.id===cell.id);
          if(!np||np.id<p.id) return;
          this.pipeLineGfx.lineStyle(3,0x4adc9a,0.8).beginPath().moveTo(cx,cy).lineTo(GRID_OFFSET_X+np.col*TILE+TILE/2,GRID_OFFSET_Y+np.row*TILE+TILE/2).strokePath();
        }
      });
    });
  }

  _findConnectedWarehouse(bld) { return this.buildings.find(b=>BUILDING_DEFS[b.type].isWarehouse) || null; }

  // 파이프용 팝업 추가
  _openPipePopup(id) {
    if (this.buildMode) return;
    const p = this.pipes.find(p => p.id === id); if (!p) return;
    this.activeBuilding = { ...p, type: 'pipe' };
    this.popupContainer.setPosition(40, GAME_HEIGHT/2 - 145);
    this.popupTitle.setText(`🔗 파이프`);
    [this.popupInfo1, this.popupInfo2, this.popupInfo3].forEach(t=>t.setText(''));
    [this.popupRunBtn, this.popupRunLbl, this.popupUpgrBtn, this.popupUpgrLbl].forEach(o=>o.setVisible(false));
    this.popupInfo1.setText('에너지를 소모하여 자원을 이송합니다.');
    this.popupContainer.setVisible(true); this.popupVisible = true;
  }

  _openPopup(id) {
    if (this.buildMode) return;
    const b = this.buildings.find(b => b.id === id); if (!b) return;
    this.activeBuilding = b;
    const def = BUILDING_DEFS[b.type];
    this.popupContainer.setPosition(40, GAME_HEIGHT/2 - 145);
    this.popupTitle.setText(`${def.icon} ${def.label}`);

    [this.popupRunBtn, this.popupRunLbl, this.popupUpgrBtn, this.popupUpgrLbl].forEach(o=>o.setVisible(false));

    if (def.isEnergyStorage) {
      const lv = ESTORE_UPGRADES[b.level-1];
      this.popupInfo1.setText(`레벨: ${lv.label}`); this.popupInfo2.setText(`슬롯 용량: ${lv.slotSize}개`); this.popupInfo3.setText(`우측 화면에서 아이템을 드래그하세요.`);
      if (ESTORE_UPGRADES[b.level]) { this.popupUpgrBtn.setVisible(true); this.popupUpgrLbl.setVisible(true).setText(`⬆️ Lv.${ESTORE_UPGRADES[b.level].level} 업그레이드`); this.popupUpgrBtn.setY(114); this.popupUpgrLbl.setY(114); }
    } else if (def.isWarehouse) {
      this.popupInfo1.setText(`📦 마을 창고와 연동됨`); this.popupInfo2.setText(''); this.popupInfo3.setText('');
    } else {
      const wh = this._findConnectedWarehouse(b);
      this.popupInfo1.setText(`상태: 정상 가동 대기 중`); this.popupInfo2.setText(wh ? `📦 연결됨` : `📦 미연결 (내부 보관)`); this.popupInfo3.setText(``);
      this.popupRunBtn.setVisible(true); this.popupRunLbl.setVisible(true); this.popupRunBtn.setY(114); this.popupRunLbl.setY(114);
    }
    this.popupContainer.setVisible(true); this.popupVisible = true;
    if (b.storage) this._openBuildingUI(b);
  }

  _openBuildingUI(b) {
    if (this.buildingUI) this.buildingUI.destroy();
    this.buildingUI = new InventoryUI(this, b.storage, {
      title: `📦 ${b.storage.label}`, depth: 97, x: 360, y: 40,
      onClose: () => { this.inventoryUI.hide(); this.inventoryUI.container.setPosition(this.inventoryUI.ox, this.inventoryUI.oy); this._closePopup(); }
    });
    this.inventoryUI.container.setPosition(360, 260);
    this.buildingUI.show(); this.inventoryUI.show();
  }

  _closePopup() {
    this.popupContainer.setVisible(false); this.popupVisible = false; this.activeBuilding = null;
    if (this.buildingUI && this.buildingUI.visible) this.buildingUI.hide();
  }

  _manualRun() {
    if (!this.activeBuilding || this.activeBuilding.type === 'pipe') return;
    const b = this.activeBuilding, def = BUILDING_DEFS[b.type];
    if (def.resource === 'mineral') {
      const wh = this._findConnectedWarehouse(b);
      const hasEnergy = this._totalEnergy() > 0;
      if (wh?.storage && hasEnergy) { wh.storage.add('mineral', 5); this._showHint('⛏️ +5 광물 → 📦 창고 자동 이송!'); }
      else { b.storage.add('mineral', 5); this._showHint('⛏️ +5 광물 → 채굴기 보관함 (최대 100)'); }
      if (this.buildingUI) this.buildingUI.refresh();
    }
  }

  _upgradeEstore() {
    if (!this.activeBuilding || this.activeBuilding.type === 'pipe') return;
    const b = this.activeBuilding, next = ESTORE_UPGRADES[b.level];
    if (!next) return;
    if (playerInventory.count('mineral') < next.upgradeCost) { this._showHint(`❌ 광물 부족`); return; }
    playerInventory.consume('mineral', next.upgradeCost);
    b.level++;
    b.storage.maxStack = ESTORE_UPGRADES[b.level-1].slotSize;
    while (b.storage.slots.length < ESTORE_UPGRADES[b.level-1].slots) b.storage.slots.push({itemId: null, count: 0});
    this._updateHUD(); this._openPopup(b.id);
  }

  // 파이프도 철거 가능하도록 로직 추가
  _demolishBuilding() {
    if (!this.activeBuilding) return;
    const b = this.activeBuilding;
    if (b.type === 'pipe') {
      this.grid[b.col][b.row] = null;
      b.gfx.destroy();
      this.pipes = this.pipes.filter(x => x.id !== b.id);
    } else {
      for (let dc=0; dc<b.w; dc++) for (let dr=0; dr<b.h; dr++) this.grid[b.col+dc][b.row+dr] = null;
      b.gfx.forEach(g=>g.destroy());
      this.buildings = this.buildings.filter(x=>x.id!==b.id);
    }
    this._redrawGrid(); this._redrawPipeLines(); this._closePopup(); this._updateHUD();
  }

  _totalEnergy() {
    let e = 0;
    this.buildings.filter(b => BUILDING_DEFS[b.type].isEnergyStorage).forEach(b => {
      b.storage.slots.forEach(sl => { if (sl.itemId) e += (ENERGY_ITEMS[sl.itemId]?.power||0)*sl.count; });
    });
    return e;
  }

  _consumeEnergy(amount) {
    let rem = amount;
    for (const b of this.buildings.filter(b => BUILDING_DEFS[b.type].isEnergyStorage)) {
      for (const sl of b.storage.slots) {
        if (!sl.itemId || sl.count <= 0 || rem <= 0) continue;
        const power = ENERGY_ITEMS[sl.itemId]?.power || 1;
        const used  = Math.min(sl.count, Math.ceil(rem/power));
        sl.count -= used; rem -= used*power;
        if (sl.count <= 0) { sl.itemId = null; sl.count = 0; }
      }
    }
    return rem <= 0;
  }

  _tickProduction() {
    if (this._totalEnergy() <= 0) { this._updateHUD(); return; }
    const cost = 1 + this._calcPipeEnergyCost();
    if (!this._consumeEnergy(cost)) { this._updateHUD(); return; }

    this.buildings.forEach(b => {
      const def = BUILDING_DEFS[b.type];
      if (def.rate <= 0) return;
      const wh = this._findConnectedWarehouse(b);
      if (wh?.storage) { wh.storage.add('mineral', def.rate); }
      else if (b.storage) { b.storage.add('mineral', def.rate); }
    });
    this._updateHUD();
    if (this.inventoryUI?.visible) this.inventoryUI.refresh();
    if (this.buildingUI?.visible)  this.buildingUI.refresh();
  }

  _showHint(msg) {
    if (!this.hintText) this.hintText=this.add.text(GAME_WIDTH/2,GAME_HEIGHT-14,'',{fontSize:'12px',fill:'#ffffff',fontFamily:'Arial',backgroundColor:'#00000099',padding:{x:8,y:3}}).setOrigin(0.5).setDepth(60);
    this.hintText.setText(msg).setVisible(true);
    this.time.delayedCall(2000, () => this.hintText.setVisible(false));
  }

  update(t, delta) {
    this.joystick.update(this);
    if (this.popupVisible || this.inventoryUI.visible) return;
    let vx=0, vy=0;
    if (this.wasd.A.isDown||this.cursors.left.isDown)  { vx=-this.speed; this.facing='left'; }
    if (this.wasd.D.isDown||this.cursors.right.isDown) { vx= this.speed; this.facing='right'; }
    if (this.wasd.W.isDown||this.cursors.up.isDown)    { vy=-this.speed; this.facing='up'; }
    if (this.wasd.S.isDown||this.cursors.down.isDown)  { vy= this.speed; this.facing='down'; }
    if (this.joystick.active) { vx=this.joystick.vx*this.speed; vy=this.joystick.vy*this.speed; }
    if (vx!==0&&vy!==0) { vx*=0.707; vy*=0.707; }

    this.px = Phaser.Math.Clamp(this.px+vx*(delta/1000), GRID_OFFSET_X+12, GRID_OFFSET_X+GRID_COLS*TILE-12);
    this.py = Phaser.Math.Clamp(this.py+vy*(delta/1000), GRID_OFFSET_Y+12, GRID_OFFSET_Y+GRID_ROWS*TILE-12);
    this.player.setPosition(this.px, this.py);
    this.playerDir.setPosition(this.px, this.py-16).setAngle({ up:0, down:180, left:270, right:90 }[this.facing] || 0);

    if (this.buildMode) this._updateGhost();

    // 건물 및 파이프 감지 로직 통합
    let nearest=null, nd=Infinity, nType=null;
    const RANGE = TILE * 2.5;
    this.buildings.forEach(b=>{
      const d=Phaser.Math.Distance.Between(this.px,this.py, GRID_OFFSET_X+(b.col+b.w/2)*TILE, GRID_OFFSET_Y+(b.row+b.h/2)*TILE);
      if (d<RANGE && d<nd) { nearest=b; nd=d; nType='bldg'; }
    });
    this.pipes.forEach(p=>{
      const d=Phaser.Math.Distance.Between(this.px,this.py, GRID_OFFSET_X+p.col*TILE+TILE/2, GRID_OFFSET_Y+p.row*TILE+TILE/2);
      if (d<RANGE && d<nd) { nearest={...p, type:'pipe'}; nd=d; nType='pipe'; }
    });

    this.nearbyBuilding=nearest;
    if (nearest) {
      const lbl = nType === 'pipe' ? '파이프' : BUILDING_DEFS[nearest.type].label;
      this.interactPrompt.setText(`[E] ${lbl}`).setPosition(GRID_OFFSET_X+(nearest.col+(nearest.w||1)/2)*TILE, GRID_OFFSET_Y+nearest.row*TILE-6).setVisible(true);
    } else {
      this.interactPrompt.setVisible(false);
    }
  }
}

class FieldScene extends Phaser.Scene {
  constructor() { super('FieldScene'); }
  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a0a0a).setOrigin(0);
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, '🚧 Phase 2: 필드 전투 구현 예정', { fontSize: '20px', fill: '#555555', fontFamily: 'Arial' }).setOrigin(0.5);
    const btn = this.add.rectangle(60, 25, 100, 34, 0x2c3e50).setInteractive({ useHandCursor: true });
    this.add.text(60, 25, '← 마을로', { fontSize: '13px', fill: '#aaaaaa', fontFamily: 'Arial' }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('HubScene'));
  }
}

class CraftScene extends Phaser.Scene {
  constructor() { super('CraftScene'); }
  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a1a).setOrigin(0);
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, '🚧 Phase 4: 제작소 구현 예정', { fontSize: '20px', fill: '#555555', fontFamily: 'Arial' }).setOrigin(0.5);
    const btn = this.add.rectangle(60, 25, 100, 34, 0x2c3e50).setInteractive({ useHandCursor: true });
    this.add.text(60, 25, '← 마을로', { fontSize: '13px', fill: '#aaaaaa', fontFamily: 'Arial' }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('HubScene'));
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d0020',
  parent: 'game-container',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, HubScene, BaseScene, FieldScene, CraftScene]
};
const game = new Phaser.Game(config);
