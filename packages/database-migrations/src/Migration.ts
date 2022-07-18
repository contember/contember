import { MigrationBuilder } from 'node-pg-migrate'
import { Connection } from '@contember/database'

export class Migration<Args = unknown> {
	constructor(
		public readonly name: string,
		public readonly migration: (builder: MigrationBuilder, args: MigrationArgs<Args>) => Promise<void> | void,
	) {
	}
}

export type MigrationArgs<Args> =
	& Args
	& {
		connection: Connection.ConnectionLike
	}
