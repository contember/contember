import { GraphQLClient } from 'graphql-request'
import { Migration } from '@contember/schema-migrations'
import { ExecutedMigration, ExecutedMigrationInfo } from '../migrations'

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

	public async migrate(migrations: Migration[], force = false): Promise<void> {
		const query = `
mutation($migrations: [Migration!]!) {
	migrate: ${force ? 'forceMigrate' : 'migrate'}(migrations: $migrations) {
		ok
		errors {
			code
			migration
			message: developerMessage
		}
	}
}
`
		const result = (
			await this.apiClient.request<{
				migrate: { ok: boolean; errors: { code: MigrateErrorCode; migration: string; message: string }[] }
			}>(query, {
				migrations,
			})
		).migrate
		if (!result.ok) {
			throw result.errors
		}
	}

	public async migrationDelete(version: string): Promise<void> {
		const query = `
mutation($version: String!) {
	migrationDelete(migration: $version) {
		ok
		error {
			developerMessage
		}
	}
}
`
		const result = (
			await this.apiClient.request<{
				migrationDelete: { ok: boolean; error?: { developerMessage: string } }
			}>(query, {
				version,
			})
		).migrationDelete
		if (!result.ok) {
			throw result.error?.developerMessage
		}
	}

	public async migrationModify(version: string, modification: Partial<Migration>): Promise<void> {
		const query = `
mutation($version: String!, $modification: MigrationModification!) {
	migrationModify(migration: $version, modification: $modification) {
		ok
		error {
			developerMessage
		}
	}
}
`
		const result = (
			await this.apiClient.request<{
				migrationModify: { ok: boolean; error?: { developerMessage: string } }
			}>(query, {
				version,
				modification,
			})
		).migrationModify
		if (!result.ok) {
			throw result.error?.developerMessage
		}
	}

	public async listExecutedMigrations(): Promise<ExecutedMigrationInfo[]> {
		const query = `query {
	executedMigrations {
		name
		version
		formatVersion
		checksum
		executedAt
	}
}`
		return (
			await this.apiClient.request<{
				executedMigrations: ExecutedMigrationInfo[]
			}>(query, {})
		).executedMigrations.map(it => ({ ...it, executedAt: new Date(it.executedAt) }))
	}

	public async getExecutedMigration(version: string): Promise<ExecutedMigration> {
		const query = `query($version: String!) {
	executedMigrations(version: $version) {
		name
		version
		formatVersion
		checksum
		executedAt
		modifications
	}
}`
		return (
			(
				await this.apiClient.request<{
					executedMigrations: ExecutedMigration[]
				}>(query, { version })
			).executedMigrations.map(it => ({ ...it, executedAt: new Date(it.executedAt) }))[0] || null
		)
	}
}
