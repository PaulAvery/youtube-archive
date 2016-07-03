import $ from 'koa-route';
import ApiError from './errors/ApiError';
import NotFoundError from './errors/NotFoundError';
import BadRequestError from './errors/BadRequestError';
import UnauthorizedError from './errors/UnauthorizedError';

/* Call the given function after creating the correct error shorthands etc. */
async function callFunction(fn, meta) {
	let shorthands = {
		invalid: (message = 'Bad Request') => { throw new BadRequestError(message, meta); },
		missing: (message = 'Entry not found') => { throw new NotFoundError(message, meta); },
		unauthorized: (message = 'User not authorized') => { throw new UnauthorizedError(message, meta); }
	};

	let result = await fn(shorthands, ...meta.args, meta.options);

	return result === undefined ? {} : result;
}

export default async function(root, definitions, app) {
	let obj = {};
	let koa = await app.webserver;

	for(let {fn, url, method, path: pth} of definitions) {
		/* Create the function on the object */
		let parent = obj;

		pth.slice(0, -1).forEach(segment => {
			parent[segment] = parent[segment] || {};
			parent = parent[segment];
		});

		parent[pth[pth.length - 1]] = async (...args) => {
			let meta = {
				method: pth.join('.')
			};

			if(typeof args.slice(-1)[0] === 'object') {
				meta.options = args.slice(-1)[0];
				meta.args = args.slice(0, -1);
			} else {
				meta.options = {};
				meta.args = args;
			}

			return await callFunction(fn, meta);
		};

		/* Create the server route */
		koa.use($[method.toLowerCase()](root + url, async (ctx, next, ...args) => {
			let meta = {
				args: args,
				method: pth.join('.')
			};

			if(method === 'GET') {
				if(ctx.request.query.data) {
					meta.options = JSON.parse(ctx.request.query.data);
				}
			} else {
				meta.options = ctx.request.body;
			}

			try {
				ctx.body = await callFunction(fn, meta);
			} catch(error) {
				if(error instanceof ApiError) {
					ctx.body = error;
					ctx.status = error.status;
				} else {
					ctx.body = {
						arguments: meta.arguments,
						options: meta.options,
						method: meta.method
					};

					if(app.env !== 'production') {
						ctx.body.message = error.message;
						ctx.body.stack = error.stack;
					}

					ctx.status = 500;

					/* This was an unexpected error, so log it */
					app.logger.error(error.toString(), meta);
				}

			}
		}));
	}

	obj.ApiError = ApiError;
	obj.NotFoundError = NotFoundError;
	obj.BadRequestError = BadRequestError;
	obj.UnauthorizedError = UnauthorizedError;

	return obj;
}
