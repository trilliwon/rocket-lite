interface AppStoreConnectErrorSource {
	pointer?: string;
	parameter?: string;
}

interface AppStoreConnectErrorDetail {
	id: string;
	status: string;
	code: string;
	title: string;
	detail: string;
	source?: AppStoreConnectErrorSource;
}

interface AppStoreConnectErrorResponse {
	errors?: AppStoreConnectErrorDetail[];
}

export class AppStoreConnectError extends Error {
	public readonly statusCode?: number;
	public readonly errors?: AppStoreConnectErrorDetail[];
	public readonly raw?: unknown;

	constructor(
		message: string,
		statusCode?: number,
		response?: AppStoreConnectErrorResponse | unknown
	) {
		super(message);

		// Set error name
		this.name = 'AppStoreConnectError';

		// Set error properties
		this.statusCode = statusCode;
		this.errors = (response as AppStoreConnectErrorResponse)?.errors;
		this.raw = response;

		// Maintain proper prototype chain
		Object.setPrototypeOf(this, AppStoreConnectError.prototype);

		// Capture stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AppStoreConnectError);
		}
	}

	public toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			statusCode: this.statusCode,
			errors: this.errors,
			stack: this.stack,
		};
	}

	public static fromResponse(response: unknown): AppStoreConnectError {
		const errorResponse = response as { status?: number; data?: AppStoreConnectErrorResponse };
		const statusCode = errorResponse?.status;
		const errorData = errorResponse?.data;

		if (errorData?.errors?.[0]) {
			const firstError = errorData.errors[0];
			return new AppStoreConnectError(
				firstError.detail || firstError.title || 'App Store Connect API Error',
				statusCode,
				errorData
			);
		}

		return new AppStoreConnectError(
			'Unknown App Store Connect Error',
			statusCode,
			errorData
		);
	}
}