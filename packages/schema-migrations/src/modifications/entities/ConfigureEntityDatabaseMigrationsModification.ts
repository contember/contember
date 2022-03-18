import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { isDeepStrictEqual } from 'util'

export const ConfigureEntityDatabaseMigrationsModification: ModificationHandlerStatic<ConfigureEntityDatabaseMigrationsModificationData> = class {
	static id = 'configureEntityDatabaseMigrations'
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

	static createModification(data: ConfigureEntityDatabaseMigrationsModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.flatMap(it => {
				const originalEntity = originalSchema.model.entities[it.name]
				if (!originalEntity) {
					return []
				}
				if (!isDeepStrictEqual(it.migrations, originalEntity.migrations)) {
					return [ConfigureEntityDatabaseMigrationsModification.createModification({ entityName: it.name, migrations: it.migrations })]
				}
				return []
			})
	}
}

export interface ConfigureEntityDatabaseMigrationsModificationData {
	entityName: string
	migrations: Model.EntityMigrations
}
