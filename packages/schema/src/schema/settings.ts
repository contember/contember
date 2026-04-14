export namespace Settings {
	export type TenantSettings = {
		readonly inviteExpirationMinutes?: number
	}

	export type ContentSettings = {
		readonly shortDateResponse?: boolean
		readonly fullDateTimeResponse?: boolean
		readonly useExistsInHasManyFilter?: boolean
		readonly uuidVersion?: 4 | 7
	}

	export type ActionsSettings = {
		readonly returnTriggeredActions?: boolean
	}

	export type Schema = {
		readonly tenant?: TenantSettings
		readonly content?: ContentSettings
		readonly actions?: ActionsSettings

		/**
		 * @deprecated
		 */
		readonly useExistsInHasManyFilter?: boolean
	}
}
