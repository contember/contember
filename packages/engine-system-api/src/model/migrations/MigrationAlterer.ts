import { DatabaseContext } from '../database'
import { DeleteMigrationCommand } from '../commands'
import { Response, ResponseError, ResponseOk } from '../../utils'
import { Migration } from '@contember/schema-migrations'
import { ModifyMigrationCommand } from '../commands/migrations/ModifyMigrationCommand'
import { SchemaProvider } from './SchemaProvider'
import { SaveSchemaCommand } from '../commands/schema/SaveSchemaCommand'

export class MigrationAlterer {
	constructor(
		private readonly schemaProvider: SchemaProvider,
	) {
	}

	public async deleteMigration(
		db: DatabaseContext,
		version: string,
	): Promise<Response<undefined, DeleteMigrationErrorCode>> {
		return await db.transaction(async db => {
			const result = await db.commandBus.execute(new DeleteMigrationCommand(version))
			if (!result) {
				await db.client.connection.rollback()
				return new ResponseError(DeleteMigrationErrorCode.notFound, `Migration ${version} was not found`)
			}
			await this.refreshSchema(db)
			return new ResponseOk(undefined)
		})
	}

	public async modifyMigration(
		db: DatabaseContext,
		version: string,
		migration: Partial<Migration>,
	): Promise<Response<undefined, UpdateMigrationErrorCode>> {
		return await db.transaction(async db => {
			const result = await db.commandBus.execute(new ModifyMigrationCommand(version, migration))
			if (!result) {
				await db.client.connection.rollback()
				return new ResponseError(UpdateMigrationErrorCode.notFound, `Migration ${version} was not found`)
			}
			await this.refreshSchema(db)
			return new ResponseOk(undefined)
		})
	}

	private async refreshSchema(db: DatabaseContext): Promise<void> {
		const schemaWithMeta = await this.schemaProvider.buildSchemaFromMigrations(db)
		await db.commandBus.execute(new SaveSchemaCommand(schemaWithMeta))
	}
}

export enum DeleteMigrationErrorCode {
	notFound = 'notFound',
}

export enum UpdateMigrationErrorCode {
	notFound = 'notFound',
}
