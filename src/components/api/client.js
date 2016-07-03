import ApiError from './errors/ApiError';
import NotFoundError from './errors/NotFoundError';
import BadRequestError from './errors/BadRequestError';
import UnauthorizedError from './errors/UnauthorizedError';

window.api = definitions => {
	let obj = {};

	definitions.forEach(definition => {
		let parent = obj;

		definition.path.slice(0, -1).forEach(segment => {
			parent[segment] = parent[segment] || {};
			parent = parent[segment];
		});

		parent[definition.path[definition.path.length - 1]] = (...args) => {
			let options, parameters;

			if(typeof args.slice(-1)[0] === 'object') {
				options = args.slice(-1)[0];
				parameters = args.slice(0, -1);
			} else {
				options = {};
				parameters = args;
			}

			let url = definition.url;
			for(let i = 0; i < parameters.length; i++) {
				url = url.replace(':', parameters[i]);
			}

			if(definition.method === 'GET') {
				url += '?data=' + encodeURIComponent(JSON.stringify(options));
			}

			return window.fetch(url, {
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json' },
				method: definition.method,
				body: JSON.stringify(definition.method !== 'GET' ? options : undefined)
			}).then(response => {
				return response.json().then(json => {
					if(!response.ok) {
						let { method, message } = json;

						switch(response.status) {
							case 400:
								throw new BadRequestError(message, { arguments: args, options, method });
							case 401:
								throw new UnauthorizedError(message, { arguments: args, options, method });
							case 404:
								throw new NotFoundError(message, { arguments: args, options, method });
							default:
								throw new ApiError(500, message, { arguments: args, options, method });
						}
					} else {
						return json;
					}
				}, () => {
					throw new Error('Api did not return JSON. Something is probably horribly wrong!');
				});
			});
		};
	});

	obj.ApiError = ApiError;
	obj.NotFoundError = NotFoundError;
	obj.BadRequestError = BadRequestError;
	obj.UnauthorizedError = UnauthorizedError;

	return obj;
};
