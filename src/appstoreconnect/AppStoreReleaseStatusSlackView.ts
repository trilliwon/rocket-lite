// AppStoreReleaseStatusSlackView.ts

interface AppStoreVersion {
	type: string;
	id: string;
	attributes: {
		platform: 'IOS' | 'MAC_OS' | 'TV_OS';
		versionString: string;
		appStoreState: 'PREPARE_FOR_SUBMISSION' | 'PROCESSING' | 'WAITING_FOR_REVIEW' | 'IN_REVIEW' | 'PENDING_DEVELOPER_RELEASE' | 'READY_FOR_SALE' | 'REJECTED';
		storeIcon?: {
			templateUrl: string;
		};
		copyright?: string;
		releaseType?: 'MANUAL' | 'AFTER_APPROVAL' | 'SCHEDULED';
		earliestReleaseDate?: string;
		downloadable: boolean;
		createdDate: string;
	};
}

interface PhasedRelease {
	type: string;
	id: string;
	attributes: {
		phasedReleaseState: 'INACTIVE' | 'ACTIVE' | 'PAUSED' | 'COMPLETE';
		startDate?: string;
		totalPauseDuration?: number;
		currentDayNumber?: number;
		customerFraction?: number;
	};
}

export interface AppStoreReleaseStatus {
	version: AppStoreVersion;
	phasedRelease: PhasedRelease | null;
}

export class AppStoreReleaseStatusSlackView {
    private getDayProgress(dayNumber: number): number {
        const progressByDay: Record<number, number> = {
            1: 0.01, // 1%
            2: 0.02, // 2%
            3: 0.05, // 5%
            4: 0.10, // 10%
            5: 0.20, // 20%
            6: 0.50, // 50%
            7: 1.00  // 100%
        };
        return progressByDay[dayNumber] || 0;
    }

    private getStateEmoji(state: string): string {
        const stateEmojis: Record<string, string> = {
            'PREPARE_FOR_SUBMISSION': '📝',
            'PROCESSING': '⚙️',
            'WAITING_FOR_REVIEW': '⏳',
            'IN_REVIEW': '👀',
            'PENDING_DEVELOPER_RELEASE': '🔜',
            'READY_FOR_SALE': '✅',
            'REJECTED': '❌'
        };
        return stateEmojis[state] || '❓';
    }

    private getPhasedReleaseProgress(dayNumber: number): string {
        const fraction = this.getDayProgress(dayNumber);
        const totalBars = 10; // Increased for better visualization
        const filledBars = Math.round(fraction * totalBars);
        return '▰'.repeat(filledBars) + '▱'.repeat(totalBars - filledBars);
    }

    private formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString();
    }

    public createBlocks(status: AppStoreReleaseStatus) {
        const { version, phasedRelease } = status;

        const blocks: any[] = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*App Store Status Update* ${this.getStateEmoji(version.attributes.appStoreState)}`
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Version:* \`${version.attributes.versionString}\``
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Status:* \`${version.attributes.appStoreState}\``
                    }
                ]
            },
            {
                "type": "divider"
            }
        ];

        if (phasedRelease && phasedRelease.attributes.phasedReleaseState !== 'INACTIVE') {
            const dayNumber = phasedRelease.attributes.currentDayNumber;
            const progressBar = this.getPhasedReleaseProgress(dayNumber ?? 0);
            const progressPercentage = this.getDayProgress(dayNumber ?? 0) * 100;

            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Phased Release Status*"
                }
            });

            blocks.push({
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": `*Status:* \`${phasedRelease.attributes.phasedReleaseState}\``
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Day:* \`${dayNumber}\``
                    },
                    {
                        "type": "mrkdwn",
                        "text": `${progressBar} ${progressPercentage}%`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*Start Date:* \`${this.formatDate(phasedRelease.attributes.startDate ?? '')}\``
                    }
                ]
            });
        }

        blocks.push({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `Last updated: ${new Date().toLocaleString()}`
                }
            ]
        });

        return {
            blocks
        };
    }
}