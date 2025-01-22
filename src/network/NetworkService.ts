export interface NetworkService {
	post(url: string, body: any, headers: { [key: string]: string }): Promise<any>;
	get(url: string, query: { [key: string]: string }, headers: { [key: string]: string }): Promise<any>;
	postFormData(url: string, formData: FormData, headers: { [key: string]: string }): Promise<any>;
}
