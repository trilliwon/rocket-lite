import { NetworkService } from '../network/NetworkService';
import { SlackMessage } from './SlackMessage';
import { SlackResponse } from './SlackResponse';

export class SlackClient {
	networkService: NetworkService;
	token: string;

	constructor(networkService: NetworkService, token: string) {
		this.networkService = networkService;
		this.token = token;
	}

	async addReactions(body: any): Promise<void> {
		await this.post('https://slack.com/api/reactions.add', body);
	}

	async removeReactions(body: any): Promise<void> {
		await this.post('https://slack.com/api/reactions.remove', body);
	}

	async postMessage(message: SlackMessage): Promise<any> {
		return await this.post('https://slack.com/api/chat.postMessage', message);
	}

	async postEphemeralMessage(message: SlackMessage): Promise<void> {
		await this.post('https://slack.com/api/chat.postEphemeral', message);
	}

	async postResponse(responseURL: string, response: SlackResponse): Promise<void> {
		await this.post(responseURL, response);
	}

	async readConversationsReplies(channel: string, ts: string, limit: number = 20): Promise<any> {
		return await this.get('https://slack.com/api/conversations.replies', {
			channel: channel,
			ts: ts,
			limit: limit.toString(),
		});
	}

	async deleteMessage(responseURL: string): Promise<void> {
		await this.post(responseURL, {
			delete_original: true,
		});
	}

	async openView(triggerId: string, view: any): Promise<void> {
		await this.post('https://slack.com/api/views.open', {
			trigger_id: triggerId,
			view: view,
		});
	}

	async updateView(viewId: string, view: any): Promise<void> {
		await this.post('https://slack.com/api/views.update', {
			view_id: viewId,
			view: view,
		});
	}

	async publishView(userId: string, view: any): Promise<void> {
		const viewVersion = "1.1"

		await this.post('https://slack.com/api/views.publish', {
			user_id: userId,
			view: {
				type: "home",
				blocks: view,
				private_metadata: viewVersion
			}
		});
	}


	private async post(url: string, body: any): Promise<any> {
		const response = await this.networkService.post(url, body, {
			Authorization: 'Bearer ' + this.token,
		});

		if (!response.ok) {
			const metadata = response.response_metadata;
			if (metadata != null && metadata.messages != null && metadata.messages.length > 0) {
				throw new Error(response.error + ': ' + metadata.messages[0]);
			} else {
				throw new Error(JSON.stringify(response, null, 2));
			}
		}
		const json = await response.json();

		return json
	}

	private async get(url: string, query: { [key: string]: string }) {
		const response = await this.networkService.get(url, query, {
			Authorization: 'Bearer ' + this.token,
		});
		this.processResponse(response);
		const json = await response.json();
		return json
	}

	private async processResponse(response: any) {
		if (!response.ok) {
			const metadata = response.response_metadata;
			if (metadata.messages != null && metadata.messages.length > 0) {
				throw new Error(response.error + ': ' + metadata.messages[0]);
			} else {
				throw new Error(response.error);
			}
		}
	}

	async uploadFile(
		channelId: string,
		fileBuffer: ArrayBuffer,
		filename: string,
		title?: string,
		initialComment?: string,
		threadTs?: string
	): Promise<any> {
		const formData = new FormData();

		// Convert ArrayBuffer to Blob
		const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
		formData.append('file', blob, filename);
		formData.append('channels', channelId);

		if (title) {
			formData.append('title', title);
		}
		if (initialComment) {
			formData.append('initial_comment', initialComment);
		}
		if (threadTs) {
			formData.append('thread_ts', threadTs);
		}

		const response = await this.networkService.postFormData(
			'https://slack.com/api/files.upload',
			formData,
			{
				Authorization: `Bearer ${this.token}`,
				// Don't set Content-Type here as it's handled automatically for FormData
			}
		);

		if (!response.ok) {
			const json = await response.json();
			console.error('Error uploading file:', json);
			throw new Error(`Failed to upload file: ${json.error}`);
		}

		return await response.json();
	}

	// Utility method to handle text-to-speech and upload to Slack
	async uploadAudioMessage(
		channelId: string,
		audioBuffer: ArrayBuffer,
		title: string = 'Audio Message',
		initialComment?: string,
		threadTs?: string
	): Promise<any> {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const filename = `audio-message-${timestamp}.mp3`;

			return await this.uploadFile(
				channelId,
				audioBuffer,
				filename,
				title,
				initialComment,
				threadTs
			);
		} catch (error) {
			console.error('Error uploading audio message:', error);
			throw error;
		}
	}

	async uploadAudioFile(
		channels: string,
		audioBuffer: ArrayBuffer,
		options: {
			filename?: string,
			title?: string,
			initialComment?: string,
			threadTs?: string
		} = {}
	): Promise<any> {
		const url = 'https://slack.com/api/files.upload';

		const formData = new FormData();
		const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

		// Add required files and channels
		formData.append('file', audioBlob, options.filename || 'audio.mp3');
		formData.append('channels', channels);

		// Add optional parameters
		if (options.title) formData.append('title', options.title);
		if (options.initialComment) formData.append('initial_comment', options.initialComment);
		if (options.threadTs) formData.append('thread_ts', options.threadTs);

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.token}`
			},
			body: formData
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(`Failed to upload file: ${result}`);
		}

		return result;
	}
}
