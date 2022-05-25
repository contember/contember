import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { isDeepStrictEqual } from 'util'

export class ConfigureEnumDatabaseMigrationsModificationHandler implements ModificationHandler<ConfigureEnumDatabaseMigrationsModificationData> {

	constructor(private readonly data: ConfigureEnumDatabaseMigrationsModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(({ model }) => ({
			...model,
			enums: {
				...model.enums,
				[this.data.enumName]: {
					...model.enums[this.data.enumName],
					migrations: this.data.migrations,
				},
			},
		}))
	}

	describe() {
		return { message: `Configure migrations strategy of enum ${this.data.enumName}` }
	}
}

export interface ConfigureEnumDatabaseMigrationsModificationData {
	enumName: string
	migrations: Model.EnumMigrations
}

export const configureEnumDatabaseMigrationsModification = createModificationType({
	id: 'configureEnumDatabaseMigrations',
	handler: ConfigureEnumDatabaseMigrationsModificationHandler,
})


export class ConfigureEnumDatabaseMigrationsDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.model.enums)
			.flatMap(([name, enum_]) => {
				const originalEnum = originalSchema.model.enums[name]
				if (!originalEnum) {
					return []
				}
				if (!isDeepStrictEqual(enum_.migrations, originalEnum.migrations)) {
					return [configureEnumDatabaseMigrationsModification.createModification({
						enumName: name,
						migrations: enum_.migrations,
					})]
				}
				return []
			})
	}
}
