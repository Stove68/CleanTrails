const map = L.map("map").setView([51.1657, 10.4515], 6);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

L.marker([51.1657, 10.4515])
    .addTo(map)
    .bindPopup("CleanTrails")
    .openPopup();
