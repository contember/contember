import { DatabaseContext } from '../database'
import { DeleteMigrationCommand } from '../commands'
import { Response, ResponseError, ResponseOk } from '../../utils'
import { Migration } from '@contember/schema-migrations'
import { ModifyMigrationCommand } from '../commands/migrations/ModifyMigrationCommand'

export class MigrationAlterer {
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
			return new ResponseOk(undefined)
		})
	}
}

export enum DeleteMigrationErrorCode {
	notFound = 'notFound',
}

export enum UpdateMigrationErrorCode {
	notFound = 'notFound',
}
