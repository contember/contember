export namespace Settings {
	export type TenantSettings = {
		readonly inviteExpirationMinutes?: number
	}

	export type Schema = {
		readonly useExistsInHasManyFilter?: boolean
		readonly tenant?: TenantSettings
	}
}
