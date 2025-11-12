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

// HTML ELEMENTS SET UP

document.body.innerHTML = `
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <div id="map"></div>
`;

// MAP CREATION

const map = L.map("map").setView([36.998153710083656, -122.05660505944903], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// PLAYER MARKER

const marker = L.marker([36.998153710083656, -122.05660505944903]).addTo(map);
marker.bindTooltip("That's you!");
