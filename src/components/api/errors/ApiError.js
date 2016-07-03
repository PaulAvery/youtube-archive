export default class ApiError extends Error {
	constructor(status, message, { options, arguments: args, method }) {
		super(message);

		this.method = method;
		this.status = status;
		this.options = options;
		this.arguments = args;
	}

	toJSON() {
		return {
			method: this.method,
			status: this.status,
			message: this.message,
			options: this.options,
			arguments: this.arguments
		};
	}

	toString() {
		return `[API Error][${this.method}][${this.status}]: ${this.message}`;
	}
}
