import { DatabaseContext } from '../database'
import { DeleteMigrationCommand, RemoveEventCommand, UpdateEventCommand } from '../commands'
import { EventIdsByMigrationQuery } from '../queries'
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

			const ids = await db.queryHandler.fetch(new EventIdsByMigrationQuery(version))
			await db.commandBus.execute(new RemoveEventCommand(ids))
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
			if (migration.version && version !== migration.version) {
				const ids = await db.queryHandler.fetch(new EventIdsByMigrationQuery(version))
				for (const id of ids) {
					await db.commandBus.execute(
						new UpdateEventCommand(id, {
							version: migration.version,
						}),
					)
				}
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
