import { Endpoint } from "./Endpoint"
import { ResponseFactory } from "../utils/ResponseFactory"
import { SlackClient } from "../slack/SlackClient"
import { Env } from "../ENV"

// Need implementation
export class SlackCommandsEndpoint implements Endpoint {
	slackClient: SlackClient

	constructor(slackClient: SlackClient) {
		this.slackClient = slackClient
	}

	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method == "POST") {
			return await this.handlePostRequest(env, request, ctx)
		} else {
			return ResponseFactory.badRequest("Unsupported HTTP method: " + request.method)
		}
	}

	private async handlePostRequest(env: Env, request: Request, ctx: ExecutionContext): Promise<Response> {
		return new Response();
	}
}
