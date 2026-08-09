const map = L.map("map").setView([51.1657, 10.4515], 6);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);

let currentMarker = null;
let watchId = null;

const status = document.getElementById("status");

navigator.geolocation.getCurrentPosition(

    (position) => {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map.setView([lat, lng], 16);

        currentMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup("Mein Standort")
            .openPopup();
    },

    () => {

        status.innerText =
            "Standortfreigabe nicht verfügbar.";
    }
);

document
    .getElementById("startBtn")
    .addEventListener("click", () => {

        status.innerText =
            "🟢 Sammelaktion läuft";

        watchId =
            navigator.geolocation.watchPosition(
                () => {}
            );
    });

document
    .getElementById("stopBtn")
    .addEventListener("click", () => {

        if (watchId !== null) {

            navigator.geolocation.clearWatch(
                watchId
            );
        }

        status.innerText =
            "✅ Sammelaktion beendet";
    });
