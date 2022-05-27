import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import { createCheck, getConstraintName } from './enumUtils'

export class CreateEnumModificationHandler implements ModificationHandler<CreateEnumModificationData> {
	constructor(protected readonly data: CreateEnumModificationData, protected readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		if (this.data.migrations?.enabled == false) {
			return
		}
		builder.createDomain(this.data.enumName, 'text', {
			check: createCheck(this.data.values),
			constraintName: getConstraintName(this.data.enumName),
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(({ model }) => ({
			...model,
			enums: {
				...model.enums,
				[this.data.enumName]: {
					values: this.data.values,
					migrations: this.data.migrations ?? { enabled: true },
				},
			},
		}))
	}

	describe() {
		return { message: `Add enum ${this.data.enumName}` }
	}
}

export interface CreateEnumModificationData {
	enumName: string
	values: readonly string[]
	migrations?: Model.EnumMigrations
}

export const createEnumModification = createModificationType({
	id: 'createEnum',
	handler: CreateEnumModificationHandler,
})

export class CreateEnumDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.model.enums)
			.filter(([name]) => !originalSchema.model.enums[name])
			.map(([enumName, enum_]) => createEnumModification.createModification({
				enumName,
				values: enum_.values,
				migrations: enum_.migrations,
			}))
	}
}
