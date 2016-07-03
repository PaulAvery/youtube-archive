import $ from 'koa-route';
import fs from 'fs';
import path from 'path';
import {promise, UserError} from '../utils';
import google from 'googleapis';

/* Wrap a google api service with central error handling and as promises */
function wrap(api, handler = e => { throw e; }) {
	let wrapped = {};

	for(let prop in api) {
		/* Skip "internal" properties */
		if(prop[0] !== '_') {
			if(typeof api[prop] === 'function') {
				wrapped[prop] = (...args) => promise(cb => api[prop](...args, cb)).catch(handler);
			} else {
				wrapped[prop] = wrap(api[prop], handler);
			}
		}
	}

	return wrapped;
}

/*
 * This component provides a promise-based API to YouTube.
 * It takes care of authentication and exports two api objects:
 *
 *   user: Will be authenticated via oauth and allows retrieval of stuff like the users subscriptions
 *   system: Is authenticated via api key and allows general api access
 *
 * To allow oauth authentication a `/oauth` route is exported. If the `autenticated()` method returns false,
 * and the `user` api should be used, you have to redirect the user to this route so he may authorize our application.
 */
export default async function youtube(app, config) {
	await app.middleware;

	let koa = await app.webserver;
	let auth = new google.auth.OAuth2(config.oauth.id, config.oauth.secret, 'http://localhost:8000/oauth');

	/* Set the refresh token on the auth object */
	function setToken(token) {
		auth.setCredentials({ refresh_token: token });
	}

	/* Save the token back to disk */
	async function saveToken(token) {
		await promise(cb => fs.writeFile(config.token, token, 'utf8', cb));
	}

	/* Check if we currently have a token */
	function hasToken() {
		return !!auth.credentials.refresh_token;
	}

	/* Invalidate the current refresh token */
	function invalidateToken() {
		auth.setCredentials({});
	}

	/* Try to load the token from disk */
	try {
		let token = await promise(cb => fs.readFile(config.token, 'utf8', cb));
		setToken(token.trim());
	} catch(e) {
		invalidateToken();
	}

	/* Register oauth route */
	koa.use($.get('/oauth', async (ctx) => {
		if(ctx.query.error) {
			/* We had an authorization error */
			invalidateToken();
			app.logger.warn(`Failed to authenticate: ${ctx.query.error}`);

			throw new UserError('Failed to authenticate your youtube account');
		} else if(ctx.query.code) {
			/* If we have a token, try to add it to authenticator */
			let code = ctx.query.code;

			try {
				let tokens = await promise(cb => auth.getToken(code, cb));
				await saveToken(tokens.refresh_token);
				setToken(tokens.refresh_token);

				app.logger.info('Retrieved OAuth2 access and refresh tokens.');
			} catch(e) {
				invalidateToken();
				app.logger.warn(`Failed to retrieve OAuth2 tokens: ${e}`);

				throw new UserError('Failed to authenticate your youtube account');
			}
		} else {
			/* If we still need a token, redirect the user */
			return ctx.redirect(auth.generateAuthUrl({
				access_type: 'offline',
				prompt: 'consent',
				scope: 'https://www.googleapis.com/auth/youtube.readonly',
				state: ctx.headers.referer || '/'
			}));
		}

		/* Try to redirect to where we came from if possible */
		if(ctx.query.state) {
			return ctx.redirect(ctx.query.state);
		} else {
			return ctx.redirect('/');
		}
	}));

	/* Handle authentication errors properly */
	let api = wrap(google.youtube({ version: 'v3', auth }), e => {
		if(!hasToken() || e.message === 'invalid_grant') {
			/* Invalidate the token immediately */
			invalidateToken();

			/* Throw a user error so we can display something to the user */
			let ue = new UserError('Failed to authenticate with YouTube');
			ue.original = e;

			throw ue;
		} else {
			/* Catch it downstream */
			app.logger.warn(`API Error: ${e.message}`);

			throw e;
		}
	});

	return {
		user: api,
		system: wrap(google.youtube({ version: 'v3', auth: config.key})),
		authenticated: hasToken
	};
}

exports.default.config = {
	key: 'nokey',
	oauth: {
		id: 'noid',
		secret: 'nosecret'
	},
	token: path.join(process.cwd(), 'data', 'youtube-refresh-token')
};
