import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { isDeepStrictEqual } from 'util'

export const ConfigureEnumDatabaseMigrationsModification: ModificationHandlerStatic<ConfigureEnumDatabaseMigrationsModificationData> = class {
	static id = 'configureEnumDatabaseMigrations'
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

	static createModification(data: ConfigureEnumDatabaseMigrationsModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.model.enums)
			.flatMap(([name, enum_]) => {
				const originalEnum = originalSchema.model.enums[name]
				if (!originalEnum) {
					return []
				}
				if (!isDeepStrictEqual(enum_.migrations, originalEnum.migrations)) {
					return [ConfigureEnumDatabaseMigrationsModification.createModification({ enumName: name, migrations: enum_.migrations })]
				}
				return []
			})
	}
}

export interface ConfigureEnumDatabaseMigrationsModificationData {
	enumName: string
	migrations: Model.EnumMigrations
}
