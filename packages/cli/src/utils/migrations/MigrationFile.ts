import { Migration } from '@contember/schema-migrations'

export interface MigrationFile {
	path: string
	version: string
	name: string

	getContent: () => Promise<MigrationContent>
}

export type MigrationContent =
	| Migration
	| (() => Promise<unknown>)
