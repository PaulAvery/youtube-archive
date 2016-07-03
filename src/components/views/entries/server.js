import Vue from 'vue';
import * as app from '../../../../vue/app.vue';

export default function({ url, api, store, redirect, notFound, data }) {
	global.api = api;

	/* Hook into store if available */
	if(app.store) {
		let pending = [];

		if(store) {
			/* If initial data is available, inject it */
			app.store.replaceState(store);
		} else {
			/*
			 * Otherwise set up waiting for action completion.
			 *
			 * Therefore, lets monkeypatch the stores dispatch method,
			 * so we can keep track of the currently running actions
			 */
			let dispatch = app.store.dispatch;
			app.store.dispatch = function(...args) {
				let promise = dispatch.call(this, ...args);

				/* Add the promise to the pending array and ignore errors */
				pending.push(promise.catch(() => null));

				return promise;
			}

			/*
			 * Pass the resolver function to the renderer, so it can fetch
			 * the data once the basic render is done.
			 */
			data(() => Promise.all(pending).then(() => app.store.state));
		}
	}

	/* Hook into router if available */
	if(app.router) {
		app.router.beforeEach((transition, rd, next) => {
			if(!transition.matched.length) {
				/* Set up catch-all so we can issue server-side 404s */
				notFound();
			} else if(transition.fullPath !== url) {
				/* Set up redirection ability so we can issue server-side redirects */
				redirect(transition.fullPath);
			} else {
				next();
			}
		});
	}

	/* Create instance */
	let vm = new Vue(app);

	/* Pass current url to router */
	if(app.router) {
		app.router.push(url);
	}

	/* Return the view to render */
	return vm;
}
