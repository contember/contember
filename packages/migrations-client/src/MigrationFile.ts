import { Migration } from '@contember/schema-migrations'
import { JSONObject } from './utils/json'

export interface MigrationFile {
	path: string
	version: string
	name: string

	getContent: () => Promise<MigrationContent>
}

export const isSchemaMigration = (content: MigrationContent): content is SchemaMigration => typeof content !== 'function' && 'modifications' in content

export type ResolvedMigrationContent =
	| SchemaMigration
	| ContentMigration

export type MigrationContent =
	| ResolvedMigrationContent
	| ContentMigrationFactory

export type SchemaMigration =
	& {
		type: 'schema'
	}
	& Migration

export type ContentMigration = {
	type: 'content'
	version: string
	name: string
	queries: ContentMigrationQuery[]
}

export type ContentMigrationFactoryArgs = {
	apiBaseUrl: string
	projectName: string
	apiToken: string
}

export type ContentMigrationFactory = {
	type: 'factory'
	factory: (args: ContentMigrationFactoryArgs) => Promise<ContentMigration>
}

export type ContentMigrationQuery = {
	query: string
	variables?: JSONObject
	stage?: string
	checkMutationResult?: boolean
}

