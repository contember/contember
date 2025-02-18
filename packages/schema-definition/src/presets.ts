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

const v2_0preset: Settings.Schema = {
	tenant: {
		inviteExpirationMinutes: 60 * 24 * 7, // 7 days
	},
	content: {
		shortDateResponse: true,
		fullDateTimeResponse: true,
		useExistsInHasManyFilter: true,
	},
}


const v2_1preset: Settings.Schema = {
	...v2_0preset,
	content: {
		...v2_0preset.content,
		uuidVersion: 7,
	},
}

export const settingsPresets = {
	'v1.3': v1_3preset,
	'v1.4': v1_4preset,
	'v2.0': v2_0preset,
	'v2.1': v2_1preset,

	'latest': v2_1preset,
}
