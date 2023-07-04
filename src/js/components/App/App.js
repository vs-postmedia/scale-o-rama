import Map from '../Map/Map';
import './App.css';

// VARS
let polygons;

// map tiles & attribution
const options = {
	bearing: 0,
	center: [-122.58876218587124, 49.24433191299974],
	geocodeZoomLevel: 8,
	mapboxStyle: 'https://api.maptiler.com/maps/basic-v2/style.json?key=arETEBBqRxRrA5v30F6H',
	pitch: 0,
	zoom:  7.75
};


function init(navImages, polys) {
	polygons = polys;

	// startup the map
	Map.init(options, polygons[0]);

	// setup nav bar
	navImages.forEach((d,i) => buildNav(d, i));
}

function buildNav(img, i) {
	// load nav images
	loadNavImages(img, i + 1);

	// add event handler
	const nav = document.querySelector('#nav')

	nav.addEventListener('click', e => {
		let navEl;

		if (e.target.tagName === 'IMG') {
			const id = e.target.id
			navEl = id.substr(id.length - 1);

			// reset the map the map
			Map.removeMap();
			Map.init(options, polygons[parseInt(navEl) - 1]);
		}
		
	});
}

function loadNavImages(img, i) {
	const el = document.getElementById(`nav-0${i}`);
	const nav_img = document.createElement('img');
	nav_img.src = img; 
	nav_img.alt = `Nav 0${i} button image`;
	nav_img.id = `nav-img-0${i}`;
	el.appendChild(nav_img);
}

export default { init };
