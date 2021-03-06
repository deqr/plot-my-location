mapboxgl.accessToken = 'pk.eyJ1IjoidGFyYXNncml0c2Vua28iLCJhIjoiY2pueG84OWR3MTMydDNwcndkc2Nla3JzcyJ9.o08Y0fXney9VoeqmdAI-bg';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: [-122.43, 37.76], // San Franciso :sobbing:
    zoom: 2
});

var GEOJSON_URL = "/geojson";

var POLL_RATE = 5000; // polling rate in milliseconds
var PING_RATE = 60000;

function pingGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            handleLocation(pos);
        }, function() {
            handleLocationError(true, null);
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, null);
    }
    console.log("Pinged geolocation.");
}

function initMap() {
    map.on('load', () => {
        pingGeolocation();
        
        window.setInterval(pingGeolocation, PING_RATE);
        
        // Add the source first
        map.addSource('agents', {
            "type": "geojson",
            data: GEOJSON_URL
        });
        
        // Add the visual layer
        map.addLayer({
            "id": "agent-markers",
            "source": "agents",
            "type": "circle",
            "paint": {
                "circle-radius": 10,
                "circle-color": "#007cbf"
            }
        });
        
        console.log("Setting load interval.");
        
        // Every 5 seconds reload for new points
        window.setInterval(loadPoints, POLL_RATE);
    });
}

function panTo(pos) {
    // Move to the actual [lng, lat]
    if (pos) {
        map.flyTo({
            center: [pos.lng, pos.lat],
            zoom: 14,
            speed: 2,
            curve: 1
        });
    } else {
        setTimeout(1000, () => { map.setCenter([pos.lng, pos.lat]) });
        console.log("Error panning, trying again.");
    }
}

function moveTo(ele) {
    var uuid = $(ele)[0].innerText;
    var pos = loadedAgents[uuid];
    panTo(pos);
}

function loadPoints() {
    console.log("Queried for points");
   
    if (map.loaded()) {
        var src = map.getSource('agents');
        if (src) {
            src.setData(GEOJSON_URL);
        }
    }
}

function handleLocation(pos) {
    map.on('load', () => { panTo(pos) });
        
    // Send the position to the server
    socket.emit('position', pos);
}

function handleLocationError(browserHasGeolocation, pos) {
    console.log(browserHasGeolocation, pos);
    handleLocation({ lat : 0, lng : 0 }); // send dummy lat data
}
