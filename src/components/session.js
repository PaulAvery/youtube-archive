import convert from 'koa-convert';
import session from 'koa-generic-session';
import {EventEmitter} from 'events';

/* Create a store to store our session using our knex instance */
class Store extends EventEmitter {
	constructor(db) {
		super();

		this.db = db;
		this.emit('connect');
	}

	async get(id) {
		let sessions = await this.db('sessions').select('data', 'expires').where('id', id);

		if(!sessions[0]) {
			return null;
		} else if(sessions[0].expires < Date.now()) {
			await this.destroy(id);
			return null;
		} else {
			return JSON.parse(sessions[0].data);
		}
	}

	async set(id, data, ttl) {
		let expires = Date.now() + ttl;

		await this.db.raw('INSERT OR REPLACE INTO sessions (id, data, expires) values (?, ?, ?)', [id, JSON.stringify(data), expires]);
	}

	async destroy(id) {
		await this.db('sessions').del().where('id', id);
	}
}

/* Create middleware from it */
export default async function(app) {
	return convert(session({
		store: new Store(await app.database)
	}));
}

/* Component which loads all neccessary koa middleware */
export default async function middleware(app) {
	let koa = await app.webserver;

	koa.use(convert(session({
		store: new Store(await app.database)
	})));
}
