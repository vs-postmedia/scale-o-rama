// LIBS
import Maplibregl from 'maplibre-gl';
import centerOfMass from '@turf/center-of-mass';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';

// CSS
import './Map.css';
import './Nav.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';

// VARS
const mapLayerName = 'polygon';
let center, map, poly, polyCenter

// FUNCTIONS
async function init(options, polygon) {
	poly = polygon;

	// if we've already set the map center, use that. otherwise, set the var
	if (center === undefined) center = options.center;

	// setup the map
	map = new Maplibregl.Map({
		antialias: true,
		container: 'map',
		style: options.mapboxStyle,
		center: center,
		zoom: options.zoom,
		bearing: options.bearing,
		pitch: options.pitch	
	});

	// setup address search
	const geocoder = await setupGeocoder(map, options);

	// recenter polygon
	const geojson = recenterPolygon(center, poly);

	// Add zoom, geocode, etc, to the map
	// addMapFeatures(map, geocoder);

	map.on('load', () => addMapData(map, geojson));

	map.on('click', e => updatePolygonPosition(e));

	return map;
}

function addMapData(map, geojson) {
	const layers = map.getStyle().layers;
	// Find the index of the first symbol layer in the map style so we can insert the layer below labels
	var firstSymbolId;
	for (var i = 0; i < layers.length; i++) {
		if (layers[i].type === 'symbol') {
			firstSymbolId = layers[i].id;
			break;
		}
	}

	console.log(firstSymbolId)
	
	// add layers
	map
		// polygon
		.addSource(mapLayerName, {
			type: 'geojson',
			data: geojson
		})
		.addLayer({
			id: 'polygon',
			type: 'fill',
			source: mapLayerName,
			layout: {},
			paint: {
				'fill-color': '#DD2D25',
				'fill-opacity': 0.5,
				'fill-outline-color': '#FFF'
			}
		},
		// insert layer below labels
		firstSymbolId
	);

	// layers.forEach(layer => {
	// 	console.log(layer)
	// 	if (layer.type === 'symbol') {
	// 		map.removeLayer(layer.id);
	// 	}
	// })
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

function recenterPolygon(new_center, poly) {
	// get center of polygon
	const polyCom = centerOfMass(poly);
	polyCenter = polyCom.geometry.coordinates;

	// create a new polygon with adjusted coordinates
	const adjustedPolyCoords = poly.features[0].geometry.coordinates[0][0].map(c => {
		const lngDiff = new_center[0] - polyCenter[0];
		const latDiff = new_center[1] - polyCenter[1];

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

	return geojson;
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
					center = [
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
		// countries: 'ca',
		// filter results to only return BC
		// filter: item => { return item.properties.address['ISO3166-2-lvl4'] === 'CA-BC' },
		maplibregl: Maplibregl,
		placeholder: 'Compare to a location...'
	});

	// default zoom is too close
	geocoder.on('result', e => {
		map.flyTo({
			center: e.result.center,
			// this animation is considered essential with respect to prefers-reduced-motion
			essential: true,
			zoom: options.geocodeZoomLevel
		});
		// Perform actions after the fly-to animation is complete
		map.once('moveend', () => updatePolygonPosition(e, true));
	});

	return geocoder;
}

function removeMap() {
	// clear existing map
	if (map._removed !== true) {
		map.remove();
		// clear existing polygon
		// map
			// .removeLayer(mapLayerName)
			// .removeSource(mapLayerName);
	}
}

function updatePolygonPosition(e, flyto) {
	// source for center coords differs depending on if it's the result of a map click or geocode result
	center = (flyto === true) ? e.result.center : [e.lngLat.lng, e.lngLat.lat];
		
	// clear existing polygon
	map
		.removeLayer(mapLayerName)
		.removeSource(mapLayerName);

	// recenter & add back to the map
	const geojson = recenterPolygon(center, poly);
	addMapData(map, geojson);
}

export default { init, removeMap };
