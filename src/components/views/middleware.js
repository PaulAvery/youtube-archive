import { promise, unindent } from '../../utils';
import { createBundleRenderer } from 'vue-server-renderer';

export default function(head, serverJs, api) {
	/* Set up server-side rendering */
	let renderer;
	let lastServerJs;

	return async function(ctx, next) {
		/* Neccessary for vue renderer environment detection */
		process.env.VUE_ENV = 'server';

		if(serverJs() !== lastServerJs) {
			lastServerJs = serverJs();
			renderer = createBundleRenderer(lastServerJs);
		}

		return new Promise(async (resolve, reject) => {
			try {
				/*
				 * Flag to avoid doing two actions
				 * Because I am not sure how to abort execution of server bundle,
				 * we simply ignore anything it does after the first redirect / notFound message
				 */
				let done = false;

				/* Redirect if vue-router was redirected */
				let redirect = url => {
					if(!done) {
						done = true;
						ctx.redirect(url);
						resolve();
					}
				};

				/* Do nothing if router found no route */
				let notFound = () => {
					if(!done) {
						done = true;
						next().then(resolve, reject);
					}
				};

				/* Data handler */
				let store;
				let retriever;
				let data = r => {
					retriever = r;
				}

				/* Render everything in a first run */
				let body = await promise(cb => renderer.renderToString({
					api,
					url: ctx.path,
					redirect,
					notFound,
					data
				}, cb));

				if(!done && retriever) {
					/*
					 * If a data retriever was passed, wait for the data.
					 * Then rerender it with the fitting initial data.
					 */
					store = await retriever();
					body = await promise(cb => renderer.renderToString({
						api,
						url: ctx.path,
						redirect,
						notFound,
						data,
						store
					}, cb));
				}

				if(!done) {
					done = true;

					/* Dump the everything to the response */
					ctx.body = unindent `
						<!DOCTYPE html>
						<html>
							<head>
								${head}

								<!-- Include the views js -->
								<script src="/view-js"></script>

								<!-- Include the views css -->
								<link rel="stylesheet" type="text/css" href="/view-css">

								<!-- The server-generated initial data for the views -->
								<script>window.initialData = ${JSON.stringify(store)}</script>
							</head>
							<body>
								${body}
							</body>
						</html>
					`;

					resolve();
				}
			} catch(e) {
				reject(e);
			}
		});
	};
}
