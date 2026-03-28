import { Migration } from '@contember/schema-migrations'

export type SchemaMigrationInput =
	& {
		readonly type: 'schema'
	}
	& Migration

export type ContentMigrationInput = {
	readonly type: 'content'
	readonly version: string // YYYY-MM-DD-HHIISS
	readonly name: string // version-label
	readonly queries: readonly ContentMigrationQuery[]
}

export type ContentMigrationQuery = {
	readonly query: string
	readonly variables?: any
	readonly stage?: string
	readonly checkMutationResult?: boolean
}

export type MigrationInput =
	| SchemaMigrationInput
	| ContentMigrationInput

export type SchemaStateInput = {
	readonly acl: unknown
	readonly validation: unknown
	readonly actions: unknown
	readonly settings: unknown
}
