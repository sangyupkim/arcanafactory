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

All game logic lives in a single file: **`game.js`** (861 lines). No modules, no bundler, no dependencies beyond Phaser 3.

### Global State

- `BASE_DATA` — persists `grid`, `buildings[]`, `pipes[]` across scene transitions (so the base survives HubScene ↔ BaseScene round-trips)
- `playerInventory` / `townStorage` — shared `Inventory` instances across all scenes
- `GLOBAL_SPLIT_MODE` — `'ALL'|'HALF'|'ONE'`, controls how many items move per drag-drop

### Key Classes

| Class | Role |
|-------|------|
| `Inventory` | Slot-based item storage with stacking, consume, and slot-to-slot `move()` |
| `ItemStorage` | Extends `Inventory` with a label and custom `maxStack` |
| `InventoryUI` | Renders an inventory as a Phaser container with drag-and-drop. Registers scene-level drag events once via `scene._dragSetupDone` |
| `VirtualJoystick` | Touch joystick rendered in bottom-left; activates only when pointer starts in left half of screen |

### Scene Flow

```
BootScene → TitleScene → HubScene ↔ BaseScene
                                  ↔ FieldScene  (placeholder)
                                  ↔ CraftScene  (placeholder)
```

HubScene auto-transitions to a scene after the player stands in its zone for 600ms. BaseScene returns to HubScene on Esc or the "← 마을" button.

### BaseScene Building System

- **Grid**: `grid[col][row]` stores `{type, id}` or `null`. Size: `GRID_COLS=20` × `GRID_ROWS=15`, tile size `TILE=32px`.
- **Buildings** (`BUILDING_DEFS`): `miner`, `refinery`, `estore`, `warehouse`, `pipe`. Each has `baseW`/`baseH`, rotation swaps W↔H.
- **Ghost placement**: mouse pointer snaps to grid; `ghostTiles[]` rectangles show green/red validity.
- **Production tick**: runs every 1000ms. Costs `1 + floor(pipes/3)` energy. Miners produce 1 mineral/tick into connected warehouse or own storage.
- **Energy**: read from all `estore` buildings' storage slots. Each energy item type has a `power` value (1/5/20). `_consumeEnergy()` drains slots greedily.
- **Pipe detection**: adjacency-based line drawing in `_redrawPipeLines()`; `_findConnectedWarehouse()` returns the first warehouse in `buildings[]`.

### Data Definitions (top of game.js)

- `BUILDING_DEFS` — building types, sizes, flags (`isPipe`, `isEnergyStorage`, `isWarehouse`)
- `ESTORE_UPGRADES` — 5 upgrade levels for energy storage (slots, slotSize, upgradeCost in minerals)
- `ITEM_DEFS` — item types: `mineral`, `energy_basic/mid/high`, `gold`, `potion`
- `ENERGY_ITEMS` — energy item power values

## Development Phases

- **Phase 1** (완료): Grid base building, energy system, inventory
- **Phase 2** (예정): Field combat — `FieldScene`
- **Phase 4** (예정): Crafting — `CraftScene`
