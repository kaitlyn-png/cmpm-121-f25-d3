# CMPM 121 D3 Project: World of Bits

A location-based incremental game built with TypeScript, Leaflet, and deterministic procedural generation. Players collect and craft numeric tokens on a grid overlaid on the real world—starting near the classroom—to build a single high-value token through strategic merging.

> "It's like _2048_ meets _Pokemon Go_"

---

## 🎯 Objective

1. Collecting tokens from nearby grid cells
2. Crafting two equal-value tokens into a single token of double value

All game state is **deterministic**, the same tokens appear in the same places every time you reload.

## 🛠️ Technologies

- **TypeScript** – Core game logic
- **Leaflet** – Interactive map rendering
- **Deno + Vite** – Development server and bundling
- **GitHub Pages** – Deployment via GitHub Actions
- **_luck.ts** – Deterministic randomness using string hashing

## 🗺️ Game Mechanics

### Grid & Map

- A fixed grid of cells (size ≈ `0.0001°`) is centered on the classroom.
- Cells extend far enough that the map feels infinite (e.g., 100×100 grid), but only nearby cells are interactive.
- The player’s location is fixed at the classroom.

### Tokens

- Each cell contains a token with value `0`, `1`, `2`, or `4` (0 = empty).
- Values are generated using `luck([i, j, 'token'])` → consistent across reloads.
- Token values are **always visible** on the map (no click required).

### Inventory

- Player can carry **one token** or none.
- Carried token value is displayed in the status panel.

### Interaction

- Click a **neighboring cell** to:
  - Pick up its token (if inventory is empty)
  - Craft with its token (if values match and inventory has a token)
- Crafting: `2 + 2 → 4`, `4 + 4 → 8`, etc.
- Winning: Craft a token of value **≥8**

---

## 🧩 How to Play

1. Open the deployed site (GitHub Pages)
2. See tokens scattered around the classroom
3. Click a nearby cell with a token to pick it up
4. Find another cell with a matching token
5. Click it to craft a higher-value one
6. Repeat until you create an 8 or 16!

## 📂 Project Structure

src/
-- main.ts
-- luck.ts
-- leafetWorkaround.ts
-- style.css

public/
-- index.html

## 🔧 Development Setup

```bash
# Clone repo
git clone https://github.com/kaitlyn-png/cmpm-121-f25-d3
cd cmpm-121-f25-d3

# Install & run (Deno + Vite)
npm install
npm run dev
```
