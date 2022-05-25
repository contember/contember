import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { isDeepStrictEqual } from 'util'

export class ConfigureEntityDatabaseMigrationsModificationHandler implements ModificationHandler<ConfigureEntityDatabaseMigrationsModificationData> {
	constructor(private readonly data: ConfigureEntityDatabaseMigrationsModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => ({
				...entity,
				migrations: this.data.migrations,
			})),
		)
	}

	describe() {
		return { message: `Configure migrations strategy of ${this.data.entityName}` }
	}
}

export interface ConfigureEntityDatabaseMigrationsModificationData {
	entityName: string
	migrations: Model.EntityMigrations
}

export const configureEntityDatabaseMigrationsModification = createModificationType({
	id: 'configureEntityDatabaseMigrations',
	handler: ConfigureEntityDatabaseMigrationsModificationHandler,
})

export class ConfigureEntityDatabaseMigrationsDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.flatMap(it => {
				const originalEntity = originalSchema.model.entities[it.name]
				if (!originalEntity) {
					return []
				}
				if (!isDeepStrictEqual(it.migrations, originalEntity.migrations)) {
					return [configureEntityDatabaseMigrationsModification.createModification({
						entityName: it.name,
						migrations: it.migrations,
					})]
				}
				return []
			})
	}
}
