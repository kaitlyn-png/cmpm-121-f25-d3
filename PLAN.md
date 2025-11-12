# D3: World of Bits

# Game Design Vision

World of Bits is a minimalist, location-based incremental game where players collect numeric tokens from a grid overlaid on a real-world map. Players can pick up tokens near their fixed position (classroom), then craft adjacent matching tokens to merge them into higher-value ones (e.g., 2 + 2 → 4). The goal is to strategically grow a single token to a target value (like 8 or 16) through successive merges, with world state deterministically generated using a hash function for consistency.

# Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

# Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### Steps

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [ ] draw a rectangle representing one cell on the map
- [ ] use loops to draw a whole grid of cells on the map
- [ ] label each cell with its hashed content visibly inside the cell
- [ ] implement deterministic token spawning using Luck function (based on cell coordinates)
- [ ] make cells clickable only if within interaction radius
- [ ] allow player to pick up a token from a neighboring cell
- [ ] display current held token value on screen
- [ ] enable crafting: place held token on adjacent cell with same value → merge into value×2
- [ ] remove both source tokens, spawn new one in same cell
- [ ] visually update cell content after crafting
- [ ] ensure grid appearance persists across reloads
- [ ] clamp interaction to local neighborhood; disable clicks outside
- [ ] test workflow: collect → craft → repeat until target value is reached

## D3.b:

...

### 
