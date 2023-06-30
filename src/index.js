// CSS
import normalize from './css/normalize.css';
import colours from './css/colors.css';
import fonts from './css/fonts.css';
import css from './css/main.css';

// JS
import App from './js/components/App/App';

// IMG
import nav01 from './images/nav-01.png';
import nav02 from './images/nav-02.png';
import nav03 from './images/nav-03.png';

// DATA
import polygon_01 from './data/donnie-creek-4326.geojson';
import polygon_02 from './data/donnie-creek-4326.geojson';
import polygon_03 from './data/donnie-creek-4326.geojson';

// FUNCTIONS
const init = async () => {
	const navImages = [nav01, nav02, nav03];
	const polygons = [polygon_01, polygon_02, polygon_03];

	App.init(navImages, polygons);
};


init();