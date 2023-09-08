import { Migration, MigrationVersionHelper } from '@contember/schema-migrations'

export class ExecutedMigration implements Migration {
	public readonly version: string

	constructor(
		public readonly id: number,
		public readonly name: string,
		public readonly formatVersion: number,
		public readonly modifications: Migration.Modification[],
		public readonly executedAt: Date,
		public readonly checksum: string | null,
		public readonly type: 'schema' | 'content',

	) {
		this.version = MigrationVersionHelper.extractVersion(name)
	}
}
