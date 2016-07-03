import ApiError from './ApiError';

export default class NotFoundError extends ApiError {
	constructor(message, meta) {
		super(404, message, meta);
	}
}
