// LIBS
import Maplibregl from 'maplibre-gl';
import * as turf from '@turf/helpers';
import centerOfMass from '@turf/center-of-mass';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';

// TEMPLATES
import popupTemplate from '../../../data/popup-template';

// CSS
import './Map.css';
// import './maplibre-gl.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../../../css/popup.css';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';

// VARS
let buffers, map, popup;

// FUNCTIONS
async function init(options, poly) {
		// get center of polygon
		const polyCom = centerOfMass(poly);
		const polyCenter = polyCom.geometry.coordinates;
		console.log(`Poly Center: ${polyCenter}`)
	
		// create a new polygon with adjusted coordinates
		const adjustedPolyCoords = poly.features[0].geometry.coordinates[0][0].map(c => {
			const lngDiff = options.center[0] - polyCenter[0];
			const latDiff = options.center[1] - polyCenter[1];
	
			return [c[0] + lngDiff, c[1] + latDiff];
		});
	
		// create geojson for adjusted polygon
		var geojson = {
			"type": "Feature",
			"properties": {},
			"geometry": {
				"type": "Polygon",
				"coordinates": [adjustedPolyCoords]
			}
		};
	

	// setup the map
	map = new Maplibregl.Map({
		antialias: true,
		container: 'map',
		style: options.mapboxStyle,
		center: options.center,
		zoom: options.zoom,
		bearing: options.bearing,
		pitch: options.pitch	
	});

	// setup address search
	const geocoder = await setupGeocoder(map, options);

	// setup popup for buffer zoness
	// const popup = setupPopup(map, buffers);

	// Add zoom, geocode, etc, to the map
	addMapFeatures(map, geocoder);

	// add data
	map.on('load', () => {
		const layers = map.getStyle().layers;
		// Find the index of the first symbol layer in the map style
		var firstSymbolId;
		for (var i = 0; i < layers.length; i++) {
			if (layers[i].type === 'symbol') {
				firstSymbolId = layers[i].id;
				break;
			}
		}
		// add layers
		map
			// polygon
			.addSource('polygon', {
				type: 'geojson',
				data: geojson
			})
			.addLayer({
				id: 'polygon',
				type: 'fill',
				source: 'polygon',
				layout: {},
				paint: {
					'fill-color': '#DD2D25',
					'fill-opacity': 0.5,
					'fill-outline-color': '#FFF'
				}
			},
			// insert below labels
			firstSymbolId
		);
	});
}


function addMapFeatures(map, geocoder) {
	map
		// geolocate control
		.addControl(
			new Maplibregl.GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: true
			}))
		// geodcoder to search an address
		.addControl(geocoder)
		// zoom
		.addControl(
			new Maplibregl.NavigationControl()
		);

}

async function setupGeocoder(map, options) {
	// create geolocator
	const geocoder_api = {
		forwardGeocode: async (config) => {
			const features = [];
			
			try {
				let request =
				'https://nominatim.openstreetmap.org/search?q=' + config.query + '&format=geojson&polygon_geojson=1&addressdetails=1';
				const response = await fetch(request);
				const geojson = await response.json();
				
				for (let feature of geojson.features) {
					let center = [
						feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2,
						feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2
					];

					let point = {  
							type: 'Feature',
							geometry: {
							type: 'Point',
							coordinates: center
						},
						place_name: feature.properties.display_name,
						properties: feature.properties,
						text: feature.properties.display_name,
						place_type: ['place'],
						center: center
					};
				
					features.push(point);
				}
			} catch (e) {
				console.error(`Failed to forwardGeocode with error: ${e}`);
			}
			
			return {
				features: features
			};
		}
	};

	const geocoder = new MaplibreGeocoder(geocoder_api, {
		clearOnBlur: true,
		// Filter results to only include addresses in Canada
		countries: 'ca',
		filter: item => { return item.properties.address['ISO3166-2-lvl4'] === 'CA-BC' },
		maplibregl: Maplibregl,
		placeholder: 'Lookup an address...'
	});

	// default zoom is too close
	geocoder.on('result', e => {
		map.flyTo({
		// map.easeTo({
			center: e.result.center,
			// this animation is considered essential with respect to prefers-reduced-motion
			essential: true,
			zoom: options.geocodeZoomLevel
		});
		// Perform actions after the fly-to animation is complete
		map.once('moveend', () => showPopup(e, true));
	});

return geocoder;
}

function setupPopup(map) {
	// create a popup but don't add it to the map yet...
	popup = new Maplibregl.Popup({
		closeButton: true,
		closeonClick: false
	});

	// mouseevents for popup
	// map.on('mouseenter', 'buffers-1k', showPopup);
	// map.on('click', 'buffers-1k', showPopup);
	map.on('click', showPopup)
}

function showPopup(e, flyto) {
	const data = [];

	console.log(e)

	// create a geojson & set lnglat coords for our point – differs depending on if it's the result of a map click or geocode result
	const point = (flyto === true) ? turf.point(e.result.center) : turf.point([e.lngLat.lng, e.lngLat.lat]);
	const lng_lat = (flyto === true) ? e.result.center : e.lngLat

	// find out if the point is inside buffers
	buffers.buffers_1k.features.forEach(d => {
		// is point within a buffer polygon?
		const withinPoly = PointsWithinPolygon(point, d);
		// if so, let's cache the buffer
		if (withinPoly.features.length > 0) data.push(d);
	});

	// add up all the values from the overlapping buffers
	const totals = addBufferValues(data);

	// we don't need a popup if we're not inside a buffer...
	if (totals === undefined) return;

	// fill in the popup template
	const html = popupTemplate(totals);

	// populate the popup, set coordinates & display on map
	popup
		// .setLngLat(e.lngLat)
		.setLngLat(lng_lat)
		.setHTML(html)
		.addTo(map);
}


export default { init };
