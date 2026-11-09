import { ExpectedQuery } from '@contember/database-tester'

export const getConfigSql = (overrides: Record<string, unknown> = {}): ExpectedQuery => ({
	sql: `select *  from "tenant"."config"`,
	parameters: [],
	response: {
		rows: [
			{
				id: 'b65949a6-b481-40b5-a0ed-0acdb5a24cb6',
				passwordless_enabled: 'never',
				passwordless_url: null,
				passwordless_expiration_minutes: 5,
				...overrides,
			},
		],
	},
})
