import crypto from 'crypto'

export interface MigrationInfo {
	readonly version: string // YYYY-MM-DD-HHIISS
	readonly name: string // version-label
	readonly formatVersion: number
}

interface Migration extends MigrationInfo {
	readonly modifications: readonly Migration.Modification[]
}

namespace Migration {
	export type Modification<Data = { [field: string]: any }> = { modification: string } & Data
}

export const calculateMigrationChecksum = (migration: Migration): string => {
	const canonicalMigration = JSON.stringify(migration.modifications)
	return crypto //
		.createHash('md5')
		.update(canonicalMigration)
		.digest('hex')
}
export { Migration }
