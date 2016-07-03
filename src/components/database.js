import fs from 'fs-extra';
import path from 'path';
import knex from 'knex';
import {promise} from '../utils';

/*
 * This component simply provides a knex instance to the application
 * It uses an sqlite database for simplicity
 */
export default async function database(app, config) {
	/* Create the directory for the database file */
	await promise(cb => fs.mkdirp(path.dirname(config.file), cb));

	let db = knex({
		client: 'sqlite3',
		useNullAsDefault: true,
		connection: {
			filename: config.file
		}
	});

	/* Die on failure to connect */
	db.client.pool.on('error', e => app.emit('app:fatal', e));

	/* Log each query during development */
	if(app.env !== 'production') {
		db.on('query', data => app.logger.child('query').trace(data.sql, {bindings: data.bindings}));
	}

	/* Try to shut down gracefully */
	app.on('app:shutdown', () => db.destroy());

	return db;
}

exports.default.config = {
	file: path.join(process.cwd(), 'data', 'youtube-archive.sqlite')
};
