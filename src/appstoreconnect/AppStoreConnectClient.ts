import { NetworkService } from '../network/NetworkService';
import { JWTGenerator } from '../utils/JWTGenerator';
import { AppStoreConnectError } from './AppStoreConnectError';
import { AppStoreReleaseStatus } from './AppStoreReleaseStatusSlackView';

export interface AppStoreConnectTokenConfig {
	keyId: string;
	issuerId: string;
	privateKey: string;
}

export class AppStoreConnectClient {
	private readonly networkService: NetworkService;
	private config: AppStoreConnectTokenConfig;

	constructor(networkService: NetworkService, config: AppStoreConnectTokenConfig) {
		this.networkService = networkService;
		this.config = config;
	}

	public async generateAppStoreToken(): Promise<string> {
		const { keyId, issuerId, privateKey } = this.config;

		try {
			const jwt = new JWTGenerator(keyId, issuerId, privateKey);
			const token = await jwt.generateToken();
			return token;
		} catch (error) {
			throw error;
		}
	}

	private async getAuthHeaders(): Promise<Record<string, string>> {
		const token = await this.generateAppStoreToken();
		return {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		};
	}

	public async getAppStoreVersions(appId: string, headers?: Record<string, string>): Promise<any> {
		try {
			const queryParams = new URLSearchParams();
			queryParams.set('limit', '1');

			const url = `https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions`;
			const response = await this.networkService.get(
				url,
				Object.fromEntries(queryParams),
				headers ?? await this.getAuthHeaders()
			);

			const json = await response.json();
			return json;
		} catch (error) {
			console.error('Error getting app store versions', error);
			throw AppStoreConnectError.fromResponse(error);
		}
	}

	public async getPhasedReleaseStatus(versionId: string, headers?: Record<string, string>): Promise<any> {
		try {
			const url = `https://api.appstoreconnect.apple.com/v1/appStoreVersions/${versionId}/appStoreVersionPhasedRelease`;
			const response = await this.networkService.get(
				url,
				{},
				headers ?? await this.getAuthHeaders()
			);

			const json = await response.json();
			return json;
		} catch (error) {
			console.error('Error getting phased release status', error);
			throw AppStoreConnectError.fromResponse(error);
		}
	}

	public async getLatestVersionWithPhasedRelease(appId: string): Promise<AppStoreReleaseStatus> {
		const headers = await this.getAuthHeaders();
		const versionsResponse = await this.getAppStoreVersions(appId, headers);

		const latestVersion = versionsResponse.data[0];
		if (!latestVersion) throw new Error('No latest version found');

		try {
			const phasedResponse = await this.getPhasedReleaseStatus(latestVersion.id, headers);
			return {
				version: latestVersion,
				phasedRelease: phasedResponse.data
			};
		} catch (error) {
			console.error('Error getting phased release status', error);
			throw error;
		}
	}
}
