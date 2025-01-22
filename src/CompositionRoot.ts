import { AppStoreConnectClient, AppStoreConnectTokenConfig } from './appstoreconnect/AppStoreConnectClient';
import { SlackCommandsEndpoint } from './endpoints/SlackCommandsEndpoint';
import { SlackEventsEndpoint } from './endpoints/SlackEventsEndpoint';
import { SlackInteractivityEndpoint } from './endpoints/SlackInteractivityEndpoint';
import { NetworkService } from './network/NetworkService';
import { NetworkServiceLive } from './network/NetworkServiceLive';
import { SlackClient } from './slack/SlackClient';

export class CompositionRoot {

	static getSlackCommandsEndpoint(slackToken: string): SlackCommandsEndpoint {
		return new SlackCommandsEndpoint(
			this.getSlackClient(slackToken)
		);
	}

	static getSlackInteractivityEndpoint(slackToken: string): SlackInteractivityEndpoint {
		return new SlackInteractivityEndpoint(
			this.getSlackClient(slackToken),
		);
	}

	static getSlackEventsEndpoint(slackToken: string, appStoreConnectConfig: AppStoreConnectTokenConfig): SlackEventsEndpoint {
		return new SlackEventsEndpoint(
			this.getSlackClient(slackToken),
			this.getAppStoreConnectClient(appStoreConnectConfig)
		);
	}

	private static getAppStoreConnectClient(config: AppStoreConnectTokenConfig): AppStoreConnectClient {
		return new AppStoreConnectClient(this.getNetworkService(), config);
	}

	private static getSlackClient(token: string): SlackClient {
		return new SlackClient(this.getNetworkService(), token);
	}

	private static getNetworkService(): NetworkService {
		return new NetworkServiceLive();
	}
}
