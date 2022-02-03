import { MigrationBuilder } from 'node-pg-migrate'

export class Migration {
	constructor(
		public readonly name: string,
		public readonly migration: (builder: MigrationBuilder, args: any) => Promise<void> | void,
	) {
	}
}
