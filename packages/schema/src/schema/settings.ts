export namespace Settings {
	export type TenantSettings = {
		readonly inviteExpirationMinutes?: number
	}

	export type ContentSettings = {
		readonly shortDateResponse?: boolean
		readonly fullDateTimeResponse?: boolean
		/**
		 * Controls how DateTime values are serialized when {@link fullDateTimeResponse} is enabled.
		 *
		 * - `legacy` (default): emit the raw PostgreSQL text representation,
		 *   e.g. `2024-01-01 11:22:33.444444+00`. Backward-compatible.
		 * - `iso8601`: emit a valid ISO 8601 string with `T` separator and `Z` suffix,
		 *   e.g. `2024-01-01T11:22:33.444444Z`.
		 */
		readonly dateTimeResponseFormat?: 'legacy' | 'iso8601'
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
