import ApiError from './ApiError';

export default class UnauthorizedError extends ApiError {
	constructor(message, meta) {
		super(401, message, meta);
	}
}
