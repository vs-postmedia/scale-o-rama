import Map from '../Map/Map';
import './App.css';

// data imports
import locations from '../../../data/facilities';
import buffers from '../../../data/facilities-buffers';

// map tiles & attribution
const options = {
	bearing: 0,
	center: [-122.98876218587124, 49.24433191299974],
	geocodeZoomLevel: 14,
	mapboxStyle: 'https://api.maptiler.com/maps/basic-v2/style.json?key=arETEBBqRxRrA5v30F6H',
	pitch: 45,
	zoom:  9.25
};


function init(polygon) {

	Map.init(options, polygon);	
}

export default { init };
