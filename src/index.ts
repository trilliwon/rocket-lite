import { Router } from 'itty-router';
import { CompositionRoot } from './CompositionRoot';
import { Env } from './ENV';
import { ResponseFactory } from './utils/ResponseFactory';
import { Endpoint } from './endpoints/Endpoint';
import { verifySlackSignature } from './verifySlackSignature';

// Create a new router instance
const router = Router();

router.get('/', async (request: Request, env: Env, ctx: ExecutionContext) => {
	return new Response('What\'s up?');
});

// This is the last route we define, it will match anything that hasn't hit a route we've defined above.
router.all('*', async (request: Request, env: Env, ctx: ExecutionContext) => {
	const url = new URL(request.url);

	const pathComponents = url.pathname
		.slice(1)
		.split('/')
		.filter((e) => e.length > 0);

	if (pathComponents.length === 0) {
		return new Response('404, What\'s up?', { status: 404 });
	}

	switch (pathComponents[0]) {
		case 'slack':
			const endpoint = getSlackEndpoint(pathComponents, env);
			if (endpoint != null) {
				const clonedRequest = await request.clone();
				const isSlackSignatureVerified = await verifySlackSignature(clonedRequest, env.SLACK_SIGNING_SECRET);
				if (isSlackSignatureVerified) {
					return await endpoint.fetch(request, env, ctx);
				} else {
					return ResponseFactory.unauthorized('The Slack signature is invalid');
				}
			} else {
				return new Response('404, not found!', { status: 404 });
			}
		default:
			return new Response('404, not found!', { status: 404 });
	}
});

function getSlackEndpoint(pathComponents: string[], env: Env): Endpoint | null {
	if (pathComponents.length > 0 && pathComponents[0] !== 'slack') {
		return null
	}

	if (pathComponents.length < 2) {
		return null
	}

	switch (pathComponents[1]) {
		case 'events':
			return CompositionRoot.getSlackEventsEndpoint(
				env.SLACK_BOT_USER_OAUTH_TOKEN,
				{
					issuerId: env.APP_STORE_ISSUER_ID,
					keyId: env.APP_STORE_KEY_ID,
					privateKey: env.APP_STORE_PRIVATE_KEY
				}
			);
		case 'commands':
			return CompositionRoot.getSlackCommandsEndpoint(env.SLACK_BOT_USER_OAUTH_TOKEN);
		case 'interactivity':
			return CompositionRoot.getSlackInteractivityEndpoint(env.SLACK_BOT_USER_OAUTH_TOKEN);
		default:
			return null;
	}
}

export const scheduled = async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
	const slackEndpoint = CompositionRoot.getSlackEventsEndpoint(
		env.SLACK_BOT_USER_OAUTH_TOKEN,
		{
			issuerId: env.APP_STORE_ISSUER_ID,
			keyId: env.APP_STORE_KEY_ID,
			privateKey: env.APP_STORE_PRIVATE_KEY
		}
	);

	// Every 10 minutes check (Korean time)
	if (event.cron === '*/10 * * * *') {
		const appstoreReleaseStatusPromise = slackEndpoint.sendAppStoreReleaseStatusChanges(
			env,
			'XXXXXXX', // https://trilliwon.slack.com/archives/XXXXXXX
			{
				inspire: '6443771811', // https://apps.apple.com/app/id6443771811
				swipp: '1487761617', // https://apps.apple.com/app/id1487761617
			}
		);
		ctx.waitUntil(appstoreReleaseStatusPromise);
	}
};

export default {
	fetch: router.handle,
	scheduled,
};