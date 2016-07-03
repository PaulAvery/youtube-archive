import fs from 'fs';
import path from 'path';
import hogan from 'hogan.js';
import {promise} from '../../utils';

/*
 * This component simply provides a few error template functions.
 * They are used by our webserver in case something goes wrong.
 */
export default async function errors(app) {
	let dir = path.join(__dirname, 'templates');
	let files = await promise(cb => fs.readdir(dir, cb));
	let debug = app.env !== 'production';
	let templates = {};

	for(let file of files) {
		templates[path.basename(file, '.mustache')] = hogan.compile(await promise(cb => fs.readFile(path.join(dir, file), 'utf8', cb)));
	}

	return {
		404: () => templates[404].render(),
		500: (message, stack) => templates[500].render({ debug, message, stack })
	};
}
