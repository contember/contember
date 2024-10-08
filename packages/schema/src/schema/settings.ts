export namespace Settings {
	export type TenantSettings = {
		readonly inviteExpirationMinutes?: number
	}

	export type ContentSettings = {
		readonly shortDateResponse?: boolean
		readonly fullDateTimeResponse?: boolean
		readonly useExistsInHasManyFilter?: boolean
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
