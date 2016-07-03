import ApiError from './ApiError';

export default class BadRequestError extends ApiError {
	constructor(message, meta) {
		super(400, message, meta);
	}
}
