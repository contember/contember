import { Migration } from '@contember/schema-migrations'

export type SchemaMigrationInput =
	& {
		type: 'schema'
	}
	& Migration

export type ContentMigrationInput = {
	type: 'content'
	readonly version: string // YYYY-MM-DD-HHIISS
	readonly name: string // version-label
	readonly queries: readonly ContentMigrationQuery[]
}

type ContentMigrationQuery = {
	readonly query: string
	readonly variables?: any
	readonly stage?: string
}

export type MigrationInput =
	| SchemaMigrationInput
	| ContentMigrationInput
