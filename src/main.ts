import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import "./style.css";

// HTMl

document.body.innerHTML = `
  <p id = "title"> World of Hearts </p>
  <div id="map"></div>
  <div id="controlPanel"></div>
  <div id="statusPanel"></div>
`;

// UI SETUP

const mapDiv = document.getElementById("map") as HTMLDivElement;
mapDiv.id = "map";
document.body.appendChild(mapDiv);

const controlPanelDiv = document.getElementById(
  "controlPanel",
) as HTMLDivElement;
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const statusPanelDiv = document.getElementById("statusPanel") as HTMLDivElement;
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// CONSTANTS

const startingPos = { x: 36.997936938057016, y: -122.05703507501151 };
const ORIGIN_POS = L.latLng(36.997936938057016, -122.05703507501151);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const WIN_CONDITION_VALUE = 2048;

let SCORE = 0;

// let userX = startingPos.x;
// let userY = startingPos.y;

// MAP CREATION

const map = L.map(mapDiv, {
  center: [startingPos.x, startingPos.y],
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  renderer: L.canvas(),
}).setView([startingPos.x, startingPos.y], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// GRID + TOKEN LAYER

const w = window as unknown as { _gridLayer?: L.LayerGroup };
const gridLayer = w._gridLayer || L.layerGroup().addTo(map);
w._gridLayer = gridLayer;

// TOKENS

const cellTokens = new Map<string, number>();
const pickedUpBase = new Set<string>();

const HEART_PALETTE = ["❤️", "🧡", "💛", "💚", "💙", "💜", "💖"];

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
  const cellKey = `${i},${j}`;
  if (cellTokens.has(cellKey)) return cellTokens.get(cellKey) || null;
  if (pickedUpBase.has(cellKey)) return null;
  return getBaseTokenValue(i, j);
}

function getTokenDisplay(i: number, j: number): string | null {
  const cellKey = `${i},${j}`;
  if (cellTokens.has(cellKey)) {
    const v = cellTokens.get(cellKey) as number;
    return heartForValue(v);
  }
  if (!pickedUpBase.has(cellKey)) {
    const v = getBaseTokenValue(i, j);
    if (v !== null) return heartForValue(v);
  }
  return null;
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

function _getPlayerCell() {
  const origin = ORIGIN_POS;
  const i = Math.floor((player.latLng.lat - origin.lat) / TILE_DEGREES);
  const j = Math.floor((player.latLng.lng - origin.lng) / TILE_DEGREES);
  return { i, j };
}

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
  if (player.heldToken !== null) {
    maxScore = player.heldToken;
  }
  for (const v of cellTokens.values()) {
    if (v > maxScore) {
      maxScore = v;
    }
  }
  SCORE = maxScore;
}

// PICKUP / CRAFT

function pickUpToken(i: number, j: number): boolean {
  if (player.heldToken !== null) return false;
  const cellKey = `${i},${j}`;
  const tokenValue = getTokenValueInCell(i, j);
  if (tokenValue === null) return false;
  if (cellTokens.has(cellKey)) {
    cellTokens.delete(cellKey);
  } else {
    pickedUpBase.add(cellKey);
  }
  player.heldToken = tokenValue;
  player.updateUI();
  return true;
}

function craftToken(i: number, j: number): boolean {
  if (player.heldToken === null) return false;
  const cellKey = `${i},${j}`;
  const cellValue = getTokenValueInCell(i, j);
  if (cellValue === null) return false;
  if (cellValue !== player.heldToken) return false;
  const newValue = player.heldToken * 2;
  cellTokens.set(cellKey, newValue);
  pickedUpBase.delete(cellKey);
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
  for (const v of cellTokens.values()) {
    if (v >= WIN_CONDITION_VALUE) {
      setTimeout(
        () =>
          alert(
            `You Win! 🎉 You reached a token value of ${player.heldToken}!`,
          ),
        100,
      );
      break;
    }
  }
}

// DRAW GRID
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
      const actionable = withinRadius && (canPickUp || canCraft);

      const tokenDisplay = getTokenDisplay(i, j);

      let cellLabel = "";
      if (tokenDisplay) {
        cellLabel = `<div class="cell-token">${tokenDisplay}</div>`;
      }

      const rectangle = L.rectangle(cellBounds, {
        color: actionable ? "#2b8f6f" : "#ccc",
        weight: actionable ? 1 : 0.5,
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
        } else {
          craftToken(i, j);
        }
        drawGrid();
      });

      if (actionable) {
        rectangle.bindTooltip(
          player.heldToken === null ? "Pick up heart" : "Place to combine",
          {
            permanent: false,
            direction: "top",
          },
        );
      }
    }
  }
}

// INITIALIZE

drawGrid();
player.updateUI();
map.on("moveend", drawGrid);
