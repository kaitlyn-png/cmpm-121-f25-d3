import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import "./style.css";

// UI SETUP

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// CONSTANTS

const TILE_DEGREES = 1e-4;
const CLASSROOM_LATLNG = L.latLng(36.997936938057016, -122.05703507501151);

// MAP CREATION

const map = L.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: 19,
  minZoom: 19,
  maxZoom: 19,
  renderer: L.canvas(),
});

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// PLAYER MARKER

L.marker(CLASSROOM_LATLNG).addTo(map).bindTooltip("Me!");

// GRID + TOKEN LAYER

const w = window as unknown as { _gridLayer?: L.LayerGroup };
const gridLayer = w._gridLayer || L.layerGroup().addTo(map);
w._gridLayer = gridLayer;

// CELLS

function cellToLatLngBounds(i: number, j: number) {
  const origin = CLASSROOM_LATLNG;
  return L.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);
}

// TOKENS

type TokenType = "coin" | "gem" | "mushroom";

function getTokenType(i: number, j: number): TokenType | null {
  const l = luck(`cell-${i}-${j}`);

  if (l < 0.1) return "gem";
  if (l < 0.3) return "coin";
  if (l < 0.4) return "mushroom";
  return null;
}

function renderToken(i: number, j: number) {
  const type = getTokenType(i, j);
  if (!type) return;

  const origin = CLASSROOM_LATLNG;
  const lat = origin.lat + (i + 0.5) * TILE_DEGREES;
  const lng = origin.lng + (j + 0.5) * TILE_DEGREES;

  const emojiMap: Record<TokenType, string> = {
    coin: "🪙",
    gem: "💎",
    mushroom: "🍄",
  };

  const icon = L.divIcon({
    html: emojiMap[type],
    className: "token-icon",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  L.marker([lat, lng], { icon }).addTo(gridLayer);
}

// DRAW GRID

function drawGrid() {
  gridLayer.clearLayers();

  const bounds = map.getBounds();
  const origin = CLASSROOM_LATLNG;

  const minI = Math.floor((bounds.getSouth() - origin.lat) / TILE_DEGREES);
  const maxI = Math.floor((bounds.getNorth() - origin.lat) / TILE_DEGREES);
  const minJ = Math.floor((bounds.getWest() - origin.lng) / TILE_DEGREES);
  const maxJ = Math.floor((bounds.getEast() - origin.lng) / TILE_DEGREES);

  for (let i = minI; i <= maxI; i++) {
    for (let j = minJ; j <= maxJ; j++) {
      const cellBounds = cellToLatLngBounds(i, j);
      L.rectangle(cellBounds, {
        color: "#ccc",
        weight: 0.5,
        fillOpacity: 0.05,
      }).addTo(gridLayer);

      renderToken(i, j);
    }
  }
}

drawGrid();

map.on("moveend", drawGrid);
