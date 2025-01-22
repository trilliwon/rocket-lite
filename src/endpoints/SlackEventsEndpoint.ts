import { AppStoreConnectClient } from '../appstoreconnect/AppStoreConnectClient';
import { AppStoreReleaseStatus, AppStoreReleaseStatusSlackView } from '../appstoreconnect/AppStoreReleaseStatusSlackView';
import { Env } from '../ENV';
import { readRequestBody } from '../utils/readRequestBody';
import { ResponseFactory } from '../utils/ResponseFactory';
import { SlackClient } from '../slack/SlackClient';
import { SlackEventType } from '../slack/SlackEventType';
import { Endpoint } from './Endpoint';

export class SlackEventsEndpoint implements Endpoint {
	slackClient: SlackClient;
	appStoreConnectClient: AppStoreConnectClient;

	constructor(slackClient: SlackClient, appStoreConnectClient: AppStoreConnectClient) {
		this.slackClient = slackClient;
		this.appStoreConnectClient = appStoreConnectClient;
	}

	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method == 'POST') {
			return await this.handlePostRequest(request, env, ctx);
		} else {
			return ResponseFactory.badRequest('Unsupported HTTP method: ' + request.method);
		}
	}

	private async handlePostRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const body = await readRequestBody(request);
		if (body.type == SlackEventType.URL_VERIFICATION) {
			return new Response(body.challenge);
		} else if (body.type == SlackEventType.EVENT_CALLBACK) {
			const event = body.event;

			// Ignore bot messages
			if (event.bot_profile != null) {
				return new Response();
			}

			if (event.type === SlackEventType.APP_MENTION) {
				const answerPromise = this.postAnswerForThread(
					event.channel,
					event.thread_ts ?? event.ts,
				);
				await ctx.waitUntil(answerPromise);
			}
			return new Response();
		} else {
			return new Response('Unsupported request from from Slack of type ' + body.type, {
				status: 400,
				statusText: 'Bad Request',
			});
		}
	}

	private async postAnswerForThread(
		channel: string,
		threadTs: string,
	) {
		// dummy message
		await this.slackClient.postMessage({
			channel: channel,
			thread_ts: threadTs,
			blocks: [{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'What\'s up?',
				},
			}],
		});
	}

	async postAppStoreReleaseStatus(env: Env, slackChannelId: string) {
		const appStoreStatus = await this.appStoreConnectClient.getLatestVersionWithPhasedRelease('1163786766');
		const statusView = new AppStoreReleaseStatusSlackView();
		const message = statusView.createBlocks(appStoreStatus);
		await this.slackClient.postMessage({
			channel: slackChannelId,
			blocks: message.blocks,
		});
	}

	async sendAppStoreReleaseStatusChanges(
		env: Env,
		slackChannelId: string,
		apps: Record<string, string>
	) {
		for (const [appName, appId] of Object.entries(apps)) {
			const currentStatus = await this.appStoreConnectClient.getLatestVersionWithPhasedRelease(appId);

			// Get previous status from KV with app-specific key
			const kvKey = `lastStatus_${appId}`;
			const previousStatusJson = await env.APPSTORECONNECT_TOKEN_STORE.get(kvKey);
			const previousStatus = previousStatusJson ? JSON.parse(previousStatusJson) : null;

			// Check for changes
			if (this.shouldNotifyAppStoreReleaseStatusChanges(previousStatus, currentStatus)) {
				const statusView = new AppStoreReleaseStatusSlackView();
				const message = statusView.createBlocks(currentStatus);

				// Add app name to the notification
				message.blocks.unshift({
					type: 'header',
					text: {
						type: 'plain_text',
						text: `${appName.charAt(0).toUpperCase() + appName.slice(1)} App Status Update`,
						emoji: true
					}
				});

				await this.slackClient.postMessage({
					channel: slackChannelId,
					blocks: message.blocks,
				});
			}

			// Store current status with app-specific key
			await env.APPSTORECONNECT_TOKEN_STORE.put(kvKey, JSON.stringify(currentStatus));
		}
	}

	private shouldNotifyAppStoreReleaseStatusChanges(previous: AppStoreReleaseStatus | null, current: AppStoreReleaseStatus): boolean {
		if (!previous) return true;

		return (
			// Version changes
			previous.version.attributes.versionString !== current.version.attributes.versionString ||
			previous.version.attributes.appStoreState !== current.version.attributes.appStoreState ||

			// Phased release changes
			previous.phasedRelease?.attributes.phasedReleaseState !== current.phasedRelease?.attributes.phasedReleaseState ||
			previous.phasedRelease?.attributes.currentDayNumber !== current.phasedRelease?.attributes.currentDayNumber ||
			!previous.phasedRelease !== !current.phasedRelease // Phased release started or ended
		);
	}
}
