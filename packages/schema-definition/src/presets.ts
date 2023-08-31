import { Settings } from '@contember/schema'

const v1_3preset: Settings.Schema = {
	useExistsInHasManyFilter: true,
	tenant: {
		inviteExpirationMinutes: 60 * 24 * 7, // 7 days
	},
}


const v1_4preset: Settings.Schema = {
	tenant: {
		inviteExpirationMinutes: 60 * 24 * 7, // 7 days
	},
	content: {
		shortDateResponse: true,
		useExistsInHasManyFilter: true,
	},
}

export const settingsPresets = {
	'v1.3': v1_3preset,
	'v1.4': v1_4preset,
}
