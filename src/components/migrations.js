import fs from 'fs';
import path from 'path';
import {promise, requireString} from '../utils';

/*
 * This component applies all migrations from the `src/migrations` folder on startup
 */
export default async function migrations(app) {
	let table = 'migrations';
	let database = await app.database;
	let directory = path.join(__dirname, '../migrations');

	/* Get the last applied migration */
	async function current(db) {
		return (await db.select().from('migrations').orderBy('id', 'asc').limit(1))[0];
	}

	/* Get a list of all applied migrations */
	async function list(db) {
		return await db.select().from('migrations').orderBy('id', 'asc');
	}

	/* Roll back the last migration */
	async function rollback(db) {
		let last = await current(db);

		app.logger.info(`Rolling back ${last.name}`);

		/* Roll back the migration */
		await requireString(last.content, directory).down(db);

		/* Remove it from the db */
		await db('migrations').del().where({ id: last.id });
	}

	/* Roll back to a given id */
	async function rollbackTo(db, id) {
		let count = (await list(db)).length;

		for(let i = 0; i < count - id; i++) {
			await rollback(db);
		}
	}

	/* Apply the given migration */
	async function applySingle(db, { content, name }) {
		app.logger.info(`Applying ${name}`);

		/* Apply the migration */
		await requireString(content, directory).up(db);

		/* Add it to the db */
		await db('migrations').insert({ content, name });
	}

	/* Apply the set of given migrations */
	async function apply(db, toApply) {
		/* Run everything inside of a transaction */
		await db.transaction(async (transaction) => {
			/* Get the applied migrations from the database */
			let applied = await list(transaction);

			/* Roll back to latest correctly applied migration */
			for(var i = 0; i < toApply.length; i++) {
				let file = toApply[i];

				if(i >= applied.length) {
					break;
				} else if(file.content !== applied[i].content) {
					await rollbackTo(transaction, i);
					break;
				}
			}

			/* Apply all remaining migrations */
			for(let j = i; j < toApply.length; j++) {
				await applySingle(transaction, toApply[j]);
			}
		});
	}

	async function applyFromDirectory(db) {
		/* Load all migrations from directory */
		let files = await promise(cb => fs.readdir(directory, cb));

		files = await Promise.all(files.map(async (migration) => {
			let file = path.join(directory, migration);

			return {
				id: migration.split('-')[0],
				content: await promise(cb => fs.readFile(file, 'utf8', cb)),
				name: path.basename(migration, '.js').split('-').slice(1).join('-')
			};
		}));

		/* Sort them */
		files.sort((a, b) => parseInt(a) > parseInt(b));

		/* Apply them */
		await apply(db, files.map(file => {
			return {
				name: file.name,
				content: file.content
			};
		}));
	}

	/* Create migrations table if neccessary */
	await database.schema.createTableIfNotExists(table, tbl => {
		tbl.increments();
		tbl.string('name');
		tbl.text('content');
	});

	/* Run all migrations on startup */
	await database.transaction(async (transaction) => {
		await applyFromDirectory(transaction);
	});
}
