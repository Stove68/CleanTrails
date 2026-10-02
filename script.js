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

let isTracking = false;

let actionCounter =
    parseInt(localStorage.getItem("actionCounter")) || 0;

let totalDistance =
    parseFloat(localStorage.getItem("totalDistance")) || 0;
let tours =
    JSON.parse(
        localStorage.getItem("tours")
    ) || [];
let savedRoutes =
    JSON.parse(
        localStorage.getItem("savedRoutes")
    ) || [];

const status = document.getElementById("status");
const routeCount = document.getElementById("routeCount");
const distanceCount = document.getElementById("distanceCount");
const historyList =document.getElementById("historyList");

routeCount.innerText =
    "Sammelaktionen: " + actionCounter;

distanceCount.innerText =
    "📏 Strecke: " + totalDistance.toFixed(2) + " km";

function renderHistory() {

    if (tours.length === 0) {

        historyList.innerHTML =
            "Noch keine Sammelaktionen gespeichert.";

        return;
    }

    historyList.innerHTML = "";

    tours
        .slice()
        .reverse()
        .forEach((tour) => {

            historyList.innerHTML +=

                tour.date +
                " | " +
                tour.time +
                " | " +
                tour.distance.toFixed(2) +
                " km<br>";
        });
}

renderHistory();

function renderSavedRoutes() {
    
    savedRoutes.forEach((savedRoute) => {

        if (
            savedRoute.route &&
            savedRoute.route.length > 1
        ) {
let routeColor = "green";

if (savedRoute.isoDate) {

    const routeDate =
        new Date(savedRoute.isoDate);

    const today =
        new Date();

    const ageInMonths =

        (today.getFullYear() -
         routeDate.getFullYear()) * 12 +

        (today.getMonth() -
         routeDate.getMonth());

    if (ageInMonths >= 12) {

        routeColor = "white";

    } else if (ageInMonths >= 6) {

        routeColor = "yellow";
    }
}
           L.polyline(
            smoothRoute(
            savedRoute.route
            ),
    {
        color: routeColor,
        weight: 4
    }
)
            .addTo(map)
            .bindPopup(

                "Letzte Reinigung: " +
                savedRoute.date +

                "<br>Sammler: " +
                savedRoute.collector +

                "<br>Strecke: " +
                savedRoute.distance.toFixed(2) +
                " km" +

                "<br>Pflegehäufigkeit: " +

                (savedRoute.cleanCount || 1) +
                
               "<br>Uhrzeit: " +
                (savedRoute.time || "-")
            
            );
        }
    });
}

renderSavedRoutes();

function comparePoints(pointsA, pointsB) {
    let matches = 0;

    for (let i = 0; i < 5; i++) {

        const distance = calculateDistance(
            pointsA[i][0],
            pointsA[i][1],
            pointsB[i][0],
            pointsB[i][1]
        );

        if (distance < 0.05) {
            matches++;
        }
    }

    return matches >= 3;
}

function isSameRoute(
    routeA,
    routeB
) {

    if (
        !routeA ||
        !routeB ||
        routeA.length < 5 ||
        routeB.length < 5
    ) {
        return false;
    }

    const pointsA = [

        routeA[0],

        routeA[
            Math.floor(
                routeA.length * 0.25
            )
        ],

        routeA[
            Math.floor(
                routeA.length * 0.5
            )
        ],

        routeA[
            Math.floor(
                routeA.length * 0.75
            )
        ],

        routeA[
            routeA.length - 1
        ]
    ];

    const pointsB = [

        routeB[0],

        routeB[
            Math.floor(
                routeB.length * 0.25
            )
        ],

        routeB[
            Math.floor(
                routeB.length * 0.5
            )
        ],

        routeB[
            Math.floor(
                routeB.length * 0.75
            )
        ],

        routeB[
            routeB.length - 1
        ]
    ];

  const forwardMatch =
    comparePoints(
        pointsA,
        pointsB
    );

const reverseMatch =
    comparePoints(
        pointsA,
        [...pointsB].reverse()
    );

return (
    forwardMatch ||
    reverseMatch
);
}
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
function isNearRoute(routeA, routeB) {

    if (
        !routeA ||
        !routeB ||
        routeA.length === 0 ||
        routeB.length === 0
    ) {
        return false;
    }

    const startDistance =
        calculateDistance(
            routeA[0][0],
            routeA[0][1],
            routeB[0][0],
            routeB[0][1]
        );

    const endDistance =
        calculateDistance(
            routeA[routeA.length - 1][0],
            routeA[routeA.length - 1][1],
            routeB[routeB.length - 1][0],
            routeB[routeB.length - 1][1]
        );

    return (
        startDistance < 0.02 &&
        endDistance < 0.02
    );
}
function getOverlapPercent(
    routeA,
    routeB
) {

    if (
        !routeA ||
        !routeB ||
        routeA.length === 0 ||
        routeB.length === 0
    ) {
        return 0;
    }

    let matchingPoints = 0;

    routeA.forEach((pointA) => {

        const foundMatch =
            routeB.some((pointB) => {

                const distance =
                    calculateDistance(
                        pointA[0],
                        pointA[1],
                        pointB[0],
                        pointB[1]
                    );

                return distance < 0.02;
            });

        if (foundMatch) {
            matchingPoints++;
        }
    });

    return (
        matchingPoints /
        routeA.length
    );
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
function smoothRoute(points) {

    if (points.length < 3) {
        return points;
    }

    const smoothed = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {

        const lat =
            (
                points[i - 1][0] +
                points[i][0] +
                points[i + 1][0]
            ) / 3;

        const lng =
            (
                points[i - 1][1] +
                points[i][1] +
                points[i + 1][1]
            ) / 3;

        smoothed.push([lat, lng]);
    }

    smoothed.push(
        points[points.length - 1]
    );

    return smoothed;
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
isTracking = true;
        status.innerText =
            "🟢 Sammelaktion läuft";

        watchId =
            navigator.geolocation.watchPosition(
                (position) => {

                    const lat =
                        position.coords.latitude;

                    const lng =
                        position.coords.longitude;

                    const accuracy =
                        position.coords.accuracy;

                    if (accuracy > 20) {
                        return;
                    }

                    if (routePoints.length > 0) {

                        const last =
                            routePoints[
                                routePoints.length - 1
                            ];

                        const jumpDistance =
                            calculateDistance(
                                last[0],
                                last[1],
                                lat,
                                lng
                            );

                        if (jumpDistance > 0.05) {
                            return;
                        }

                        if (jumpDistance < 0.003) {
                            return;
                        }
                    }

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


        if (!isTracking) {
            return;
        }
       
        if (watchId !== null) {

        navigator.geolocation.clearWatch(
        watchId
        );

    watchId = null;
}
        actionCounter++;

        const routeDistance =
            getRouteLength(routePoints);

        totalDistance += routeDistance;
tours.push({

    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    
    distance:
        routeDistance
   
});
isTracking = false; 
        
let matchingRoute = null;

savedRoutes.forEach((savedRoute) => {

    if (
 
        isSameRoute(
        savedRoute.route,
        routePoints
    )
 
    ||
 
    isNearRoute(
    savedRoute.route,
    routePoints
    )
 
){

        matchingRoute =
            savedRoute;
    }
});
console.log(
    "Route erkannt:",
    matchingRoute !== null
);        
if (matchingRoute) {
    
    console.log(
    "Bestehender Weg wird aktualisiert"
    );
    matchingRoute.cleanCount =
        (matchingRoute.cleanCount || 1) + 1;

    matchingRoute.date =
        new Date().toLocaleDateString();

    matchingRoute.time =
new Date().toLocaleTimeString();
    
    matchingRoute.isoDate =
        new Date().toISOString();

    matchingRoute.collector =
        "Anonym";

    matchingRoute.distance =
        routeDistance;

    matchingRoute.route =
        [...routePoints];

} else {
    
    console.log(
    "Neuer Weg wird angelegt"
    );
    
    savedRoutes.push({

        date:
            new Date().toLocaleDateString(),

        isoDate:
            new Date().toISOString(),
        
        time:
        new Date().toLocaleTimeString(),
        
        collector:
            "Anonym",

        cleanCount:
            1,

        distance:
            routeDistance,

        route:
            [...routePoints]

    });

}
        
localStorage.setItem(
    "tours",
    JSON.stringify(tours)
);
        localStorage.setItem(
    "savedRoutes",
    JSON.stringify(savedRoutes)
);
       
        renderHistory();
        
        localStorage.setItem(
            "actionCounter",
            actionCounter
        );

        localStorage.setItem(
            "totalDistance",
            totalDistance
        );

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

document
    .getElementById("menuBtn")
    .addEventListener("click", function () {

        const panel =
            document.getElementById(
                "menuPanel"
            );

        if (
            panel.style.display ===
            "block"
        ) {

            panel.style.display =
                "none";

        } else {

            panel.style.display =
                "block";
        }
    });

document
    .getElementById("grundideeTitel")
    .addEventListener("click", function () {

        const text =
            document.getElementById(
                "grundideeText"
            );

        const titel =
            document.getElementById(
                "grundideeTitel"
            );

        if (
            text.style.display ===
            "block"
        ) {

            text.style.display =
                "none";

            titel.innerText =
                "▶ 🌱 Grundidee";

        } else {

            text.style.display =
                "block";

            titel.innerText =
                "▼ 🌱 Grundidee";
        }
    });

document
    .getElementById("ausruestungTitel")
    .addEventListener("click", function () {

        const text =
            document.getElementById(
                "ausruestungText"
            );

        const titel =
            document.getElementById(
                "ausruestungTitel"
            );

        if (
            text.style.display ===
            "block"
        ) {

            text.style.display =
                "none";

            titel.innerText =
                "▶ 🧰 Ausrüstung";

        } else {

            text.style.display =
                "block";

            titel.innerText =
                "▼ 🧰 Ausrüstung";
        }
    });
document
    .getElementById("resetBtn")
    .addEventListener("click", function () {

        if (
            confirm(
                "Alle Testdaten löschen?"
            )
        ) {

                        localStorage.removeItem(
                "savedRoutes"
            );

            localStorage.removeItem(
                "tours"
            );

            localStorage.removeItem(
                "actionCounter"
            );
            localStorage.removeItem(
            "totalDistance"
            );
            savedRoutes = [];
            tours = [];

            location.reload();
        }
    });
