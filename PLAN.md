# D3: World of Bits

## Game Design Vision

World of Bits is a minimalist, location-based incremental game where players collect numeric tokens from a grid overlaid on a real-world map. Players can pick up tokens near their fixed position (classroom), then craft adjacent matching tokens to merge them into higher-value ones (e.g., 2 + 2 → 4). The goal is to strategically grow a single token to a target value (like 8 or 16) through successive merges, with world state deterministically generated using a hash function for consistency.

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

### D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

#### Steps

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] use loops to draw a whole grid of cells on the map
- [x] implement deterministic token spawning using Luck function (based on cell coordinates)
- [x] make cells clickable only if within interaction radius (add a highlight for what you can click)
- [x] allow player to pick up a token from a neighboring cell
- [x] display current held token value on screen + current score
- [x] enable crafting: place held token on adjacent cell with same value → merge into value×2
- [x] remove both source tokens, spawn new one in same cell
- [x] visually update cell content after crafting
- [x] ensure grid appearance persists across reloads
- [x] test workflow: collect → craft → repeat until target value is reached

### D3.b: Globe-spanning Gameplay

- [x] enable wasd player movement
- [x] allow for the cells to be visible as the player moves out of the map
- [x] the map can be scrolled without the player moving
- [x] player interaction is limited to nearby cells
- [x] tokens respawn when off screen
- [x] crafting enables progression toward a higher win threshold --> 2048
- [x] movement can be controlled via UI buttons or natural map panning
- [x] players can place tokens on empty spaces

### D3.c: Object persistence

- [x] cells outside the map do not require memory if they haven't been modified by the player
- [x] cells' modified state are preserved when they scroll off screen
- [x] cells are restored when they are returned to view

### D3.d: Gameplay Across Real-world Space and Time

- [x] game state persists across page loads
- [x] player moves based on geolocation
- [x] button that toggles between being able to use wasd/button movement and geolocation mode
- [x] button that starts a new game and resets all the variables
- [x] geolocation works on mobile (Google NOT iOS safari)
- [x] fix button UI
