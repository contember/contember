import { GraphQLClient } from 'graphql-request'
import { createTenantApiUrl } from '../tenant'
import { Migration } from '@contember/schema-migrations'

export type MigrateError = {
	readonly code: MigrateErrorCode
	readonly migration: string
	readonly message: string
}

export enum MigrateErrorCode {
	MustFollowLatest = 'MUST_FOLLOW_LATEST',
	AlreadyExecuted = 'ALREADY_EXECUTED',
	InvalidFormat = 'INVALID_FORMAT',
	InvalidSchema = 'INVALID_SCHEMA',
	MigrationFailed = 'MIGRATION_FAILED',
}

export type MigrateResponse = {
	readonly ok: boolean
	readonly errors: MigrateError[]
}

export const createSystemUrl = (baseUrl: string, projectName: string) => {
	if (baseUrl.endsWith('/')) {
		baseUrl = baseUrl.substring(0, baseUrl.length - 1)
	}
	return baseUrl + '/system/' + projectName
}

export class SystemClient {
	constructor(private readonly apiClient: GraphQLClient) {}

	public static create(baseUrl: string, projectName: string, apiToken: string): SystemClient {
		const graphqlClient = new GraphQLClient(createSystemUrl(baseUrl, projectName), {
			headers: {
				Authorization: `Bearer ${apiToken}`,
			},
		})
		return new SystemClient(graphqlClient)
	}

	public async migrate(migrations: Migration[]): Promise<MigrateResponse> {
		const query = `
mutation($migrations: [Migration!]!) {
	migrate(migrations: $migrations) {
		ok
		errors {
			code
			migration
			message
		}
	}
}
`
		return (
			await this.apiClient.request<{
				migrate: { ok: boolean; errors: { code: MigrateErrorCode; migration: string; message: string }[] }
			}>(query, {
				migrations: migrations.map(({ version, formatVersion, name, modifications }) => ({
					version,
					formatVersion,
					name,
					modifications: modifications.map(({ modification, ...data }) => ({
						modification,
						data: JSON.stringify(data),
					})),
				})),
			})
		).migrate
	}
}
