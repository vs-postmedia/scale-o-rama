// CSS
import normalize from './css/normalize.css';
import colours from './css/colors.css';
import fonts from './css/fonts.css';
import css from './css/main.css';

// JS
import App from './js/components/App/App';

import polygon from './data/donnie-creek-4326.geojson';

// FUNCTIONS
const init = async () => {
	App.init(polygon);
};

init();