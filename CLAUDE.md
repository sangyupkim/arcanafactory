# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step required. Open `index.html` directly in a browser, or serve with any static file server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Phaser 3.60.0 is loaded via CDN — an internet connection is required for first load.

## Architecture

All game logic lives in a single file: **`game.js`** (~2950 lines). No modules, no bundler, no dependencies beyond Phaser 3.

### Global State

| Variable | Purpose |
|----------|---------|
| `BASE_DATA` | Persists `grid`, `buildings[]`, `pipes[]` across scene transitions |
| `playerInventory` / `townStorage` | Shared `Inventory` instances across all scenes |
| `GLOBAL_SPLIT_MODE` | `'ALL'|'HALF'|'ONE'`, controls drag-drop transfer amount |
| `PLAYER_STATS` | Persistent player stats (level, atk, def, spd, maxHp, hp, exp) |
| `PLAYER_EQUIP` | Currently equipped items per slot (`weapon/armor/helmet/shoes/gloves`) |
| `PLAYER_GOLD` | Global gold value (not stored in inventory) |
| `FIELD_DATA` | `{ cleared: Set, currentStage }` — persists field progress |

### Key Classes

| Class | Role |
|-------|------|
| `Inventory` | Slot-based item storage with stacking, consume, and slot-to-slot `move()` |
| `ItemStorage` | Extends `Inventory` with a label and custom `maxStack` |
| `InventoryUI` | Renders inventory as a Phaser container with drag-and-drop. Registers scene-level drag events once via `scene._dragSetupDone` |
| `VirtualJoystick` | Touch joystick rendered in bottom-left; activates only when pointer starts in left half of screen |

### Scene Flow

```
BootScene → TitleScene → HubScene ↔ BaseScene
                                  ↔ StageSelectScene → FieldScene
                                  ↔ CraftScene
                                  ↔ SmithScene
```

HubScene auto-transitions after player stands in a zone for 600ms. BaseScene returns to HubScene on Esc or the "← 마을" button.

### Resource & Crafting System

**6-Tier Minerals**: `copper → iron → diamond → adamantium → mithril → orichalcum`
**6-Tier Wood**: `pine → ebony → ancient_oak → spirit_tree → elf_wood → world_tree`

Processing chain: Raw (×5) → **Processed** (`hard_*` / `tough_*`) → + both → **Board** (`*_board`) → Building upgrades

`CRAFT_RECIPES` — processed materials + boards (at CraftScene)
`SMITH_RECIPES` — equipment Tier 1–2 (at SmithScene)

### BaseScene Building System

- **Grid**: `grid[col][row]` stores `{type, id}` or `null`. Size: `GRID_COLS=20` × `GRID_ROWS=15`, tile size `TILE=32px`.
- **Buildings** (`BUILDING_DEFS`): `miner`, `lumber`, `refinery`, `estore`, `warehouse`, `bossgate`, `pipe`.
- **Miner** produces `MINERAL_TIERS[resTier-1]`; **Lumber** produces `WOOD_TIERS[resTier-1]`. Default `resTier=1`.
- **Tier Upgrade**: costs boards (`BUILDING_UPGRADE_DEFS`). Max tier 4 currently defined.
- **Ghost placement**: mouse pointer snaps to grid; must be within ~5 tiles of player.
- **Production tick**: runs every 1000ms. Costs `tier + floor(pipes/20)` energy. Miners/lumber mills produce 1 resource/tick.
- **Energy**: read from all `estore` buildings. Each energy item type has a `power` value (1/5/20). `_consumeEstoreEnergy()` drains slots greedily.

### Equipment System

`equipItem(itemId)` / `unequipItem(slot)` — global functions that add/subtract stats from `PLAYER_STATS`. Equipment items have `isEquip:true`, `slot`, and optional `atk/def/spd/maxHp` in `ITEM_DEFS`.

### Combat System (FieldScene)

- **Stages**: `STAGE_DATA` — World 1 (`1-1` to `1-BOSS`), World 2 (`2-1` to `2-BOSS`). World 2 unlocks after `1-BOSS` cleared or `gate_shard` obtained.
- **Enemies**: `ENEMY_DEFS` — World 1: slime/goblin/wolf/orc/darkelf/boss_golem. World 2: troll/forest_spirit/dark_wizard/stone_golem/boss_witch.
- **Wave system**: 5 waves per stage, 60s each. Boss stages are single wave.
- **Drops**: `rollOnce(drops)` — weighted random drop per enemy death.

### Data Definitions (top of game.js)

- `BUILDING_DEFS` — building types, sizes, flags (`isPipe`, `isEnergyStorage`, `isWarehouse`, `isMiner`, `isLumber`)
- `BUILDING_UPGRADE_DEFS` — tier upgrade costs for `miner` / `lumber`
- `MINERAL_TIERS` / `WOOD_TIERS` — tier arrays for resource lookup
- `ESTORE_UPGRADES` — 5 upgrade levels for energy storage
- `ITEM_DEFS` — all item types with icon, color, bg, and optional equip stats
- `CRAFT_RECIPES` — processing + board recipes (categories: `'가공'`, `'판자'`)
- `SMITH_RECIPES` — equipment recipes (categories: `'티어1'`, `'티어2'`)
- `ENEMY_DEFS` — enemy stats for both worlds
- `STAGE_DATA` — stage definitions for both worlds

## Development Phases

- **Phase 1** (완료): Grid base building, energy system, inventory, resource tiers, crafting
- **Phase 2** (완료): FieldScene — wave-based combat, drops, boss system
- **Phase 3** (예정): World 2 full content, golem system, multi-base
- **Phase 4** (예정): CraftScene advanced recipes, research tree, equipment enhancement
