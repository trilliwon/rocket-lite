export interface Env {
	SLACK_BOT_USER_OAUTH_TOKEN: string
	SLACK_SIGNING_SECRET: string

	// App Store Connect
	APP_STORE_KEY_ID: string;
	APP_STORE_ISSUER_ID: string;
	APP_STORE_PRIVATE_KEY: string;

	APPSTORECONNECT_TOKEN_STORE: KVNamespace;
}
