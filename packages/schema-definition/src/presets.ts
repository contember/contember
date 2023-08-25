import { Settings } from '@contember/schema'

const v1_3preset: Settings.Schema = {
	useExistsInHasManyFilter: true,
	tenant: {
		inviteExpirationMinutes: 60 * 24 * 7, // 7 days
	},
}
export const settingsPresets = {
	'v1.3': v1_3preset,
}
