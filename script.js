const map = L.map("map").setView([51.1657, 10.4515], 6);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let currentMarker = null;

navigator.geolocation.getCurrentPosition(
    function (position) {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map.setView([lat, lng], 16);

        currentMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup("Mein Standort")
            .openPopup();
    },

    function () {
        alert("Standortfreigabe wurde nicht erteilt.");
    }
);
