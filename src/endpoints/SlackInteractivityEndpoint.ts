import { Env } from '../ENV';
import { readRequestBody } from '../utils/readRequestBody';
import { ResponseFactory } from '../utils/ResponseFactory';
import { SlackClient } from '../slack/SlackClient';
import { SlackEventType } from '../slack/SlackEventType';
import { Endpoint } from './Endpoint';

export class SlackInteractivityEndpoint implements Endpoint {
	slackClient: SlackClient;

	constructor(slackClient: SlackClient) {
		this.slackClient = slackClient;
	}

	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method == 'POST') {
			return await this.handlePostRequest(env, request, ctx);
		} else {
			return ResponseFactory.badRequest('Unsupported HTTP method: ' + request.method);
		}
	}

	private async handlePostRequest(env: Env, request: Request, ctx: ExecutionContext): Promise<Response> {
		const body = await readRequestBody(request);
		const payload = JSON.parse(body.payload);

		switch (payload.type) {
			case SlackEventType.MESSAGE_ACTION:
				return await this.handleMessageAction(env, payload, ctx);
			case SlackEventType.SHORTCUT:
				return await this.handleShortcut(env, payload, ctx);
			case SlackEventType.BLOCK_ACTIONS:
				return await this.handleBlockAction(env, payload, ctx);
			case SlackEventType.VIEW_SUBMISSION:
				return await this.handleViewSubmission(env, payload, ctx);
			default:
				return ResponseFactory.badRequest('Unsupported payload type: ' + payload.type);
		}
	}

	private async handleMessageAction(env: Env, payload: any, ctx: ExecutionContext): Promise<Response> {
		return new Response();
	}

	private async handleShortcut(env: Env, payload: any, ctx: ExecutionContext): Promise<Response> {
		return new Response();
	}

	private async handleBlockAction(env: Env, payload: any, ctx: ExecutionContext): Promise<Response> {
		return new Response();
	}

	private async handleViewSubmission(env: Env, payload: any, ctx: ExecutionContext): Promise<Response> {
		return new Response();
	}
}
