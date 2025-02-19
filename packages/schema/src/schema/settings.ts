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

	export type Schema = {
		readonly tenant?: TenantSettings
		readonly content?: ContentSettings

		/**
		 * @deprecated
		 */
		readonly useExistsInHasManyFilter?: boolean
	}
}
