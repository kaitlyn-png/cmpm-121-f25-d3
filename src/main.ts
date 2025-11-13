import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
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

const marker = L.marker([36.997936938057016, -122.05703507501151]).addTo(map);
marker.bindTooltip("Me!");

// GRID AND CELLS

function cellToLatLngBounds(i: number, j: number) {
  const origin = CLASSROOM_LATLNG;
  return L.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);
}

function drawGrid() {
  const gridLayer = (window as any)._gridLayer || L.layerGroup().addTo(map);
  (window as any)._gridLayer = gridLayer;
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
    }
  }
}

drawGrid();

map.on("moveend", drawGrid);
