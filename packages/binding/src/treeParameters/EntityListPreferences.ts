export const EntityListPreferencesDefaults: EntityListPreferences = {
	initialEntityCount: 0,
}

export interface EntityListPreferences {
	initialEntityCount: number
}

export interface UnsugarableEntityListPreferences {
	initialEntityCount?: number
}
