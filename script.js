const map = L.map("map").setView([51.1657, 10.4515], 6);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);

let currentMarker = null;
let watchId = null;

let routePoints = [];
let routeLine = null;

let actionCounter = 0;
let totalDistance = 0;

const status = document.getElementById("status");
const routeCount = document.getElementById("routeCount");
const distanceCount = document.getElementById("distanceCount");

function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

function getRouteLength(points) {

    let distance = 0;

    for (let i = 1; i < points.length; i++) {

        distance += calculateDistance(
            points[i - 1][0],
            points[i - 1][1],
            points[i][0],
            points[i][1]
        );
    }

    return distance;
}

navigator.geolocation.getCurrentPosition(

    (position) => {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map.setView([lat, lng], 16);

        currentMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup("Mein Standort")
            .openPopup();
    }
);

document
    .getElementById("startBtn")
    .addEventListener("click", () => {

        routePoints = [];

        status.innerText =
            "🟢 Sammelaktion läuft";

        watchId =
            navigator.geolocation.watchPosition(
                (position) => {

                    const lat =
                        position.coords.latitude;

                    const lng =
                        position.coords.longitude;

                    routePoints.push([lat, lng]);

                    if (routeLine) {
                        map.removeLayer(routeLine);
                    }

                    routeLine = L.polyline(
                        routePoints,
                        {
                            color: "green",
                            weight: 6
                        }
                    ).addTo(map);

                }
            );
    });

document
    .getElementById("stopBtn")
    .addEventListener("click", () => {

        alert("STOP wurde geklickt");

        if (watchId !== null) {

            navigator.geolocation.clearWatch(
                watchId
            );
        }

        actionCounter++;

        const routeDistance =
            getRouteLength(routePoints);

        totalDistance += routeDistance;

        routeCount.innerText =
            "Sammelaktionen: " +
            actionCounter;

        distanceCount.innerText =
            "📏 Strecke: " +
            totalDistance.toFixed(2) +
            " km";

        status.innerText =
            "✅ Sammelaktion beendet";
    });
