import { NetworkService } from './NetworkService';

export class NetworkServiceLive implements NetworkService {
	async post(url: string, body: any, headers: { [key: string]: string }): Promise<any> {
		let allHeaders = headers || {};
		allHeaders['Content-Type'] = 'application/json;charset=utf-8';
		return await fetch(url, {
			method: 'post',
			body: JSON.stringify(body),
			headers: allHeaders,
		});
	}

	async get(url: string, query: { [key: string]: string }, headers: { [key: string]: string }): Promise<any> {
		let allHeaders = headers || {};
		allHeaders['Content-Type'] = 'application/json;charset=utf-8';

		// Build query string
		let queryString = Object.keys(query)
			.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
			.join('&');
		let fullUrl = url + (queryString ? `?${queryString}` : '');

		return await fetch(fullUrl, {
			method: 'get',
			headers: allHeaders,
		});
	}

	async postFormData(url: string, formData: FormData, headers: { [key: string]: string }): Promise<any> {
		let allHeaders = headers || {};
		// Don't set Content-Type as it's automatically set with boundary for FormData
		return await fetch(url, {
			method: 'post',
			body: formData,
			headers: allHeaders,
		});
	}
}
