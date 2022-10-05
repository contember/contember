import { MigrationBuilder } from 'node-pg-migrate'
import { Connection } from '@contember/database'

export type MigrationExecutor<Args = unknown> = (builder: MigrationBuilder, args: MigrationArgs<Args>) => Promise<void> | void

export class Migration<Args = unknown> {
	constructor(
		public readonly name: string,
		public readonly migration: MigrationExecutor<Args>,
		public readonly group: string | null = null,
	) {
	}
}

export type MigrationArgs<Args> =
	& Args
	& {
		connection: Connection.ConnectionLike
	}


export interface RunMigration {
	name: string
	group: string | null
}

export class MigrationGroup<Args = unknown> {
	constructor(
		public readonly group: string,
		public readonly snapshot: MigrationExecutor<Args>,
		public readonly migrations: Record<string, MigrationExecutor<Args>>,
	) {
	}
}
