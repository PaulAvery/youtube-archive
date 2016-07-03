import Vue from 'vue';
import * as app from '../../../../vue/app.vue';

/* Once we are loaded, hydrate the page */
document.addEventListener('DOMContentLoaded', () => {
	/* If the server passed us a bunch of initial data, inject it */
	if(window.initialData && app.store) {
		app.store.replaceState(window.initialData);
	}

	new Vue(app).$mount('body');
});
