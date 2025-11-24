import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import MovementFacade from "./movement.ts";
import "./style.css";

// HTML

document.body.innerHTML = `
  <p id = "title"> World of Hearts </p>
  <div id="map"></div>
  <div id="uiPanel"></div>
`;

// UI SETUP

const mapDiv = document.getElementById("map") as HTMLDivElement;
mapDiv.id = "map";
document.body.appendChild(mapDiv);

const uiPanelDiv = document.getElementById("uiPanel") as HTMLDivElement;
uiPanelDiv.id = "uiPanel";
uiPanelDiv.innerHTML = `
  <div id="control-buttons">
    <button id="upBtn">↑ W</button>
    <div id="control-buttons-row">
      <button id="leftBtn">← A</button>
      <button id="downBtn">↓ S</button>
      <button id="rightBtn">D →</button>
    </div>
  </div>
  <div id="controlsRow">
    <button id="newGameBtn">New Game</button>
    <button id="movementToggle">Toggle Movement</button>
  </div>
  <div id="statusPanel"></div>
`;
document.body.append(uiPanelDiv);

const statusPanelDiv = document.getElementById("statusPanel") as HTMLDivElement;
statusPanelDiv.id = "statusPanel";

// CELLS

interface CellState {
  tokenValue: number | null;
  lastModified: number;
}

const ORIGIN_POS = L.latLng(36.997936938057016, -122.05703507501151);
//36.97099330537876, -122.03962311957285
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const WIN_CONDITION_VALUE = 2048;
const worldData = new Map<string, CellState>();

let SCORE = 0;

const STORAGE_KEY = "wof-state-v1";
let currentMovementMode: "buttons" | "geolocation" = "buttons";

function saveGameState() {
  try {
    const worldEntries: Array<[string, CellState]> = Array.from(
      worldData.entries(),
    );
    const payload = {
      worldEntries,
      player: {
        lat: player.latLng.lat,
        lng: player.latLng.lng,
        heldToken: player.heldToken,
      },
      score: SCORE,
      movementMode: currentMovementMode,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save game state:", e);
  }
}

function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.worldEntries && Array.isArray(parsed.worldEntries)) {
      worldData.clear();
      for (const [k, v] of parsed.worldEntries) {
        worldData.set(k, v as CellState);
      }
    }
    if (parsed?.player) {
      const p = parsed.player;
      if (typeof p.lat === "number" && typeof p.lng === "number") {
        player.latLng = L.latLng(p.lat, p.lng);
        player.marker.setLatLng(player.latLng);
        map.setView(player.latLng, GAMEPLAY_ZOOM_LEVEL);
      }
      player.heldToken = typeof p.heldToken === "number" ? p.heldToken : null;
    }
    SCORE = typeof parsed.score === "number" ? parsed.score : SCORE;
    if (parsed?.movementMode === "geolocation") {
      currentMovementMode = "geolocation";
    }
  } catch (e) {
    console.warn("Failed to load game state:", e);
  }
}

function resetGame() {
  worldData.clear();
  player.latLng = ORIGIN_POS;
  player.marker.setLatLng(player.latLng);
  player.heldToken = null;
  SCORE = 0;
  map.setView(player.latLng, GAMEPLAY_ZOOM_LEVEL);
  saveGameState();
  player.updateUI();
  drawGrid();
}

// MAP CREATION

const map = L.map(mapDiv, {
  center: [ORIGIN_POS.lat, ORIGIN_POS.lng],
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  renderer: L.canvas(),
}).setView([ORIGIN_POS.lat, ORIGIN_POS.lng], GAMEPLAY_ZOOM_LEVEL);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

map.on("moveend", () => {
  drawGrid();
});

const w = window as unknown as { _gridLayer?: L.LayerGroup };
const gridLayer = w._gridLayer || L.layerGroup().addTo(map);
w._gridLayer = gridLayer;

const HEART_PALETTE = [
  "❤️", //1
  "🧡", //2
  "💛", //4
  "💚", //8
  "💙", //16
  "💜", //32
  "💔", //64
  "💗", //128
  "💕", //256
  "💞", //512
  "💘", //1024
  "💖", //2048
];

function heartForValue(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return HEART_PALETTE[0];
  const power = Math.round(Math.log2(v));
  const idx = power % HEART_PALETTE.length;
  return HEART_PALETTE[idx];
}

function getBaseTokenValue(i: number, j: number): number | null {
  const l = luck(`cell-${i}-${j}`);
  if (l < 0.1) return 2;
  if (l < 0.3) return 1;
  if (l < 0.4) return 4;
  return null;
}

function getTokenValueInCell(i: number, j: number): number | null {
  const saved = loadCell(i, j);
  if (saved) {
    return saved.tokenValue;
  }
  return getBaseTokenValue(i, j);
}

function getTokenDisplay(i: number, j: number): string | null {
  const saved = loadCell(i, j);
  if (saved) {
    if (saved.tokenValue === null) return null;
    return heartForValue(saved.tokenValue);
  }
  const base = getBaseTokenValue(i, j);
  if (base !== null) return heartForValue(base);
  return null;
}

function saveCell(i: number, j: number, value: number | null) {
  const key = `${i},${j}`;
  worldData.set(key, {
    tokenValue: value,
    lastModified: Date.now(),
  });
  saveGameState();
}

function loadCell(i: number, j: number): CellState | null {
  return worldData.get(`${i},${j}`) || null;
}

// PLAYER

const player = {
  latLng: ORIGIN_POS,
  heldToken: null as number | null,

  speed: 0.0001,
  interactionRadius: 3 * TILE_DEGREES,

  marker: L.marker(ORIGIN_POS, {
    icon: L.divIcon({
      html: "😊",
      className: "player-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
  }).addTo(map),

  updateUI() {
    const heldTokenInfo = this.heldToken !== null
      ? `${heartForValue(this.heldToken)} ${this.heldToken}`
      : "(none)";
    statusPanelDiv.innerHTML =
      `<p id = "held"> Holding: ${heldTokenInfo} </p> | <p id = "score">Score:</score> ${SCORE}`;
  },
};

const interactionCircle: L.Circle = L.circle(player.latLng, {
  radius: player.interactionRadius * 111320,
  color: "#2b8f6f",
  weight: 1,
  fillOpacity: 0.06,
  className: "interaction-circle",
}).addTo(map);

// HELPER FUNCTIONS

function isWithinInteractionRadius(i: number, j: number): boolean {
  const origin = ORIGIN_POS;
  const cellCenterLat = origin.lat + (i + 0.5) * TILE_DEGREES;
  const cellCenterLng = origin.lng + (j + 0.5) * TILE_DEGREES;
  const cellLatLng = L.latLng(cellCenterLat, cellCenterLng);
  const distance = player.latLng.distanceTo(cellLatLng); // meters
  const radiusMeters = player.interactionRadius * 111320; // degrees -> meters approx
  return distance <= radiusMeters;
}

function cellToLatLngBounds(i: number, j: number) {
  const origin = ORIGIN_POS;
  return L.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);
}

function checkScore() {
  let maxScore = 0;
  if (player.heldToken !== null) maxScore = player.heldToken;
  for (const state of worldData.values()) {
    if (state.tokenValue !== null && state.tokenValue > maxScore) {
      maxScore = state.tokenValue;
    }
  }
  SCORE = maxScore;
}

function pickUpToken(i: number, j: number): boolean {
  if (player.heldToken !== null) return false;
  const tokenValue = getTokenValueInCell(i, j);
  if (tokenValue === null) return false;
  saveCell(i, j, null);
  player.heldToken = tokenValue;
  player.updateUI();
  checkScore();
  return true;
}

function placeToken(i: number, j: number): boolean {
  if (player.heldToken === null) return false;
  const cellValue = getTokenValueInCell(i, j);
  if (cellValue !== null) return false;
  saveCell(i, j, player.heldToken);
  player.heldToken = null;
  player.updateUI();
  checkScore();
  return true;
}

function craftToken(i: number, j: number): boolean {
  if (player.heldToken === null) return false;
  const cellValue = getTokenValueInCell(i, j);
  if (cellValue === null) return false;
  if (cellValue !== player.heldToken) return false;
  const newValue = player.heldToken * 2;
  saveCell(i, j, newValue);
  player.heldToken = null;
  player.updateUI();
  checkScore();
  checkWinCondition();
  return true;
}

function checkWinCondition() {
  if (player.heldToken !== null && player.heldToken >= WIN_CONDITION_VALUE) {
    setTimeout(
      () =>
        alert(`You Win! 🎉 You reached a token value of ${player.heldToken}!`),
      100,
    );
    return;
  }
  for (const state of worldData.values()) {
    if (state.tokenValue !== null && state.tokenValue >= WIN_CONDITION_VALUE) {
      setTimeout(
        () =>
          alert(
            `You Win! 🎉 You reached a token value of ${state.tokenValue}!`,
          ),
        100,
      );
      break;
    }
  }
}

function drawGrid() {
  gridLayer.clearLayers();
  const bounds = map.getBounds();
  const origin = ORIGIN_POS;
  const minI = Math.floor((bounds.getSouth() - origin.lat) / TILE_DEGREES);
  const maxI = Math.floor((bounds.getNorth() - origin.lat) / TILE_DEGREES);
  const minJ = Math.floor((bounds.getWest() - origin.lng) / TILE_DEGREES);
  const maxJ = Math.floor((bounds.getEast() - origin.lng) / TILE_DEGREES);

  interactionCircle.setLatLng(player.latLng);
  interactionCircle.setRadius(player.interactionRadius * 111320);

  for (let i = minI; i <= maxI; i++) {
    for (let j = minJ; j <= maxJ; j++) {
      const cellBounds = cellToLatLngBounds(i, j);
      const cellValue = getTokenValueInCell(i, j);
      const withinRadius = isWithinInteractionRadius(i, j);
      const canPickUp = player.heldToken === null && cellValue !== null;
      const canCraft = player.heldToken !== null && cellValue !== null &&
        cellValue === player.heldToken;
      const canPlace = player.heldToken !== null && cellValue === null;
      const actionable = withinRadius && (canPickUp || canCraft || canPlace);

      const tokenDisplay = getTokenDisplay(i, j);

      let cellLabel = "";
      if (tokenDisplay) {
        cellLabel = `<div class="cell-token">${tokenDisplay}</div>`;
      }

      const rectangle = L.rectangle(cellBounds, {
        color: actionable ? "#2b8f6f" : "#ccc",
        weight: actionable ? 1 : 0,
        fillOpacity: actionable ? 0.12 : 0.03,
        className: "leaflet-clickable",
        interactive: true,
      }).addTo(gridLayer);

      if (cellLabel) {
        const cellCenter = cellBounds.getCenter();
        const labelIcon = L.divIcon({
          html: cellLabel,
          className: "cell-label",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        L.marker(cellCenter, { icon: labelIcon, interactive: false }).addTo(
          gridLayer,
        );
      }

      rectangle.on("click", () => {
        if (!isWithinInteractionRadius(i, j)) return;
        if (player.heldToken === null) {
          pickUpToken(i, j);
        } else if (cellValue === null) {
          placeToken(i, j);
        } else if (cellValue === player.heldToken) {
          craftToken(i, j);
        }
        drawGrid();
      });

      if (actionable) {
        rectangle.bindTooltip(
          player.heldToken === null
            ? "Pick up heart"
            : (cellValue === null ? "Place heart" : "Place to combine"),
          {
            permanent: false,
            direction: "top",
          },
        );
      }
    }
  }
}

const urlParams = new URLSearchParams(globalThis.location?.search ?? "");
if (urlParams.get("movement") === "geolocation") {
  currentMovementMode = "geolocation";
}

loadGameState();

drawGrid();
player.updateUI();

const upBtn = document.getElementById("upBtn") as HTMLButtonElement | null;
const downBtn = document.getElementById("downBtn") as HTMLButtonElement | null;
const leftBtn = document.getElementById("leftBtn") as HTMLButtonElement | null;
const rightBtn = document.getElementById("rightBtn") as
  | HTMLButtonElement
  | null;
const movementModeSpan = document.getElementById("movementMode") as
  | HTMLSpanElement
  | null;
const newGameBtn = document.getElementById("newGameBtn") as
  | HTMLButtonElement
  | null;
const movementToggle = document.getElementById("movementToggle") as
  | HTMLButtonElement
  | null;

function updateMovementUI() {
  if (movementModeSpan) movementModeSpan.textContent = currentMovementMode;
  if (movementToggle) {
    movementToggle.textContent = currentMovementMode === "buttons"
      ? "Switch to Geolocation"
      : "Switch to Buttons";
  }
}

const movement = new MovementFacade(
  {
    getPosition: () => player.latLng,
    onPosition: (pos: L.LatLng) => {
      console.log(
        `onPosition called with: lat ${pos.lat}, lng ${pos.lng}`,
      );
      player.latLng = pos;
      player.marker.setLatLng(player.latLng);
      map.setView(player.latLng, GAMEPLAY_ZOOM_LEVEL);
      console.log(
        `Map centered on: lat ${player.latLng.lat}, lng ${player.latLng.lng}, Zoom: ${GAMEPLAY_ZOOM_LEVEL}`,
      );
      drawGrid();
      player.updateUI();
      saveGameState();
    },
    speed: player.speed,
    upBtn,
    downBtn,
    leftBtn,
    rightBtn,
  },
  currentMovementMode,
);

movement.start();
updateMovementUI();

if (movementToggle) {
  movementToggle.addEventListener("click", () => {
    currentMovementMode = currentMovementMode === "buttons"
      ? "geolocation"
      : "buttons";
    movement.setMode(currentMovementMode);
    updateMovementUI();
    saveGameState();
  });
}

if (newGameBtn) {
  newGameBtn.addEventListener("click", () => {
    if (confirm("Start a new game? This will erase current progress.")) {
      resetGame();
      updateMovementUI();
    }
  });
}

globalThis.addEventListener("beforeunload", () => saveGameState());

map.on("moveend", drawGrid);
