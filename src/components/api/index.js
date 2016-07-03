import $ from 'koa-route';
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import MemoryFS from 'memory-fs';
import toRegex from 'path-to-regexp';
import {promise} from '../../utils';

import apiBuilder from './server';

/*
 * This component provides the api for the application.
 * It exports the api methods on routes under the `/api` namespace and provides a promise-based way to access them.
 * In addition it exports a javascript file under the direct `/api` route, which registers a global `api`
 * object in your clientside code. This should allow for code-reuse across client and server
 */
export default async function api(app) {
	await app.middleware;
	let koa = await app.webserver;

	let root = '/api';
	let definitions = [];

	/* Recursively load all files and register their method definitions */
	await (async function loadDirectory(dir, pth = []) {
		let entries = await promise(cb => fs.readdir(dir, cb));

		for(let entry of entries) {
			let file = path.join(dir, entry);

			if((await promise(cb => fs.stat(file, cb))).isDirectory()) {
				await loadDirectory(file, pth.concat(entry));
			} else {
				let methodPath = pth.concat(path.basename(file, '.js'));

				await require(file).default(app, {
					get: (url, fn) => definitions.push({ fn, url, method: 'GET', path: methodPath }),
					post: (url, fn) => definitions.push({ fn, url, method: 'POST', path: methodPath }),
					delete: (url, fn) => definitions.push({ fn, url, method: 'DELETE', path: methodPath }),
					route: (method, url, fn) => definitions.push({ fn, url, method, path: methodPath })
				});
			}
		}
	})(path.join(__dirname, 'methods'));

	/* Compile the client code */
	let compiler = webpack({
		name: 'api',
		entry: path.join(__dirname, './client.js'),
		output: {
			path: '/',
			filename: 'api.js'
		},
		module: {
			loaders: [{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader'
			}]
		},
		plugins: [
			new webpack.optimize.OccurenceOrderPlugin()
		]
	});

	let mfs = compiler.outputFileSystem = new MemoryFS();

	/* Compile and handle errors */
	let stats = await promise(cb => compiler.run(cb));
	if(stats.compilation.errors.length > 0 || stats.compilation.warnings.length > 0) {
		app.logger.error('API Compilation Error', { errors: stats.compilation.errors.map(e => e.toString()), warnings: stats.compilation.warnings.map(w => w.toString()) });

		throw new Error('API Compilation Error');
	}

	/* Load the output */
	let source = mfs.readFileSync('/api.js', 'utf8');

	/* Assemble the definitions to pass to the client code */
	let clientDefinitions = [];
	for(let {path: pth, url, method} of definitions) {
		let tokens = toRegex.parse(url).filter(t => typeof t === 'object').filter(t => typeof t.name === 'string').map(t => t.name);
		let clientUrl = root + toRegex.compile(url)(tokens.reduce((s, t) => { s[t] = ':'; return s; }, {}), { pretty: true });

		clientDefinitions.push({ url: clientUrl, path: pth, method });
	}

	/* Export the api definition so the client may use it */
	koa.use($.get(root, ctx => {
		ctx.type = 'application/javascript';
		ctx.body = source + `window.api = window.api(${JSON.stringify(clientDefinitions)});`;
	}));

	/* Register all the server routes and return the server-side API */
	return await apiBuilder(root, definitions, app);
}
