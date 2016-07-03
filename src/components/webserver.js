import Koa from 'koa';
import helmet from 'koa-helmet';
import bodyparser from 'koa-bodyparser';
import {serializeError} from '../utils';

/*
 * This component provides the applications webserver.
 */
export default async function webserver(app, config) {
	let koa = new Koa();
	let errors = await app.errors;

	/* Copy over some stuff */
	koa.env = app.env;
	koa.name = app.name;

	/* Set some keys for later signing of cookies */
	koa.keys = config.keys.split('|');

	/* Log errors */
	koa.on('error', e => app.logger.error(e.toString()));

	/* Log requests */
	koa.use(async (ctx, next) => {
		let start = new Date();

		await next();

		let duration = new Date() - start;
		let message = `(${duration}ms) ${ctx.method}: ${ctx.path}`;
		app.logger.child('query').trace(message, { status: ctx.status, query: ctx.query, path: ctx.path, method: ctx.method, duration: duration });
	});

	/* Handle errors */
	koa.use(async (ctx, next) => {
		try {
			await next();
		} catch(e) {
			/* Log the error */
			app.logger.error(e.toString());

			/* And output it */
			ctx.status = 500;
			ctx.body = errors[500](serializeError(e), e.stack);
		}
	});

	/* Handle not found */
	koa.use(async (ctx, next) => {
		await next();

		if(ctx.body === undefined && ctx.status === 404) {
			ctx.body = errors[404]();
			ctx.status = 404;
		}
	});

	/* Load basic middleware */
	koa.use(helmet());
	koa.use(bodyparser());

	/* Start the server on boot and shut it down afterwards */
	app.on('app:boot', () => {
		let server = koa.listen(config.port);

		app.on('app:shutdown', () => server.close());
	});

	return koa;
}

/* Set the default port */
exports.default.config = {
	port: 8000,
	keys: 'please|replace|us'
};
