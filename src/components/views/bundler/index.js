import webpack from 'webpack';
import MemoryFS from 'memory-fs';
import {promise} from '../../../utils';

import clientOptions from './clientOptions';
import serverOptions from './serverOptions';

export default function(app) {
	let logger = app.logger.child('bundler');

	/* Log a given stats object */
	function logErrors(stats) {
		let {errors, warnings} = stats.compilation;

		warnings.forEach(w => logger.warn(w));

		if(errors.length > 0) {
			errors.forEach(e => logger.error(`${e}`));

			return true;
		} else {
			return false;
		}
	}

	/* Extract data from memory filesystem */
	function loadOutput(mfs) {
		let css, clientJs, serverJs;

		/*
		 * Try to load the output. Because not all files need to have been created,
		 * we fall back to an empty string
		 */
		try {
			clientJs = mfs.readFileSync('/client.js', 'utf8');
		} catch(e) {
			clientJs = '';
		}

		try {
			serverJs = mfs.readFileSync('/server.js', 'utf8');
		} catch(e) {
			serverJs = '';
		}

		try {
			css = mfs.readFileSync('/css', 'utf8');
		} catch(e) {
			css = '';
		}

		return {
			css,
			clientJs,
			serverJs
		};
	}

	/* Rebundle upon changes */
	async function watch(compiler, mfs) {
		let css = '';
		let clientJs = '';
		let serverJs = '';

		let resolve;
		let firstRun = new Promise(res => { resolve = res; });

		let watcher = compiler.watch({ aggregateTimeout: 300 }, (e, stats) => {
			if(e) {
				logger.error(`Failed to bundle views: ${e}`);
			} else {
				let hasError = logErrors(stats);

				if(!hasError) {
					let output = loadOutput(mfs);
					logger.info(`Bundled ${stats.compilation.options.name} views`);

					css = output.css;
					clientJs = output.clientJs;
					serverJs = output.serverJs;

					/* Because client and server js may be spit out in multiple calls we need to wait until both are ready */
					if(resolve && clientJs.length && serverJs.length) {
						resolve();
						resolve = null;
					}
				}
			}
		});

		/* Close the watcher on application shutdown */
		app.on('shutdown', () => promise(cb => watcher.close(cb)));

		/* Wait for first successful compilation */
		await firstRun;

		/* Return accessors to allow the same access in development and production builds */
		return {
			css: () => css,
			clientJs: () => clientJs,
			serverJs: () => serverJs
		};
	}

	/* Bundle the client and serverside javascript and css */
	async function build(compiler, mfs) {
		/* Compile and handle errors */
		let stats = await promise(cb => compiler.run(cb));
		let hasError = stats.stats.map(logErrors).find(d => d === true);

		/* Die immediately in production */
		if(hasError) {
			throw new Error('Failed to bundle views');
		}

		/* Load data from disk */
		let {css, clientJs, serverJs} = loadOutput(mfs);
		logger.info('Bundled views');

		/* Return accessors to allow the same access in development and production builds */
		return {
			css: () => css,
			clientJs: () => clientJs,
			serverJs: () => serverJs
		};
	}

	return function() {
		/* Create the compiler and output to memory */
		let compiler = webpack([clientOptions(app.env === 'production'), serverOptions()]);
		let mfs = compiler.outputFileSystem = new MemoryFS();

		return app.env === 'production' ? build(compiler, mfs) : watch(compiler, mfs);
	};
}
