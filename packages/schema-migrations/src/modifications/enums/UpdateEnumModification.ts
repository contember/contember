import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { createCheck, getConstraintName } from './enumUtils'

export const UpdateEnumModification: ModificationHandlerStatic<UpdateEnumModificationData> = class {
	static id = 'updateEnum'
	constructor(private readonly data: UpdateEnumModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		builder.sql(`
			ALTER DOMAIN "${this.data.enumName}"
			DROP CONSTRAINT ${getConstraintName(this.data.enumName)}`)
		builder.sql(`
			ALTER DOMAIN "${this.data.enumName}"
			ADD CONSTRAINT ${getConstraintName(this.data.enumName)} CHECK (${createCheck(this.data.values)})`)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(({ model }) => ({
			...model,
			enums: {
				...model.enums,
				[this.data.enumName]: { values: this.data.values },
			},
		}))
	}

	describe() {
		const currentEnum = this.schema.model.enums[this.data.enumName]
		const missingValues = currentEnum.values.filter(it => !this.data.values.includes(it))
		const failureWarning =
			missingValues.length > 0
				? `Removing values (${missingValues.join(', ')}) from enum, this may fail in runtime`
				: undefined
		return { message: `Update enum ${this.data.enumName}`, failureWarning }
	}

	static createModification(data: UpdateEnumModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.model.enums)
			.filter(
				([name]) =>
					originalSchema.model.enums[name] &&
					!deepEqual(updatedSchema.model.enums[name].values, originalSchema.model.enums[name].values),
			)
			.map(([enumName, enum_]) => UpdateEnumModification.createModification({ enumName, values: enum_.values }))
	}
}

export interface UpdateEnumModificationData {
	enumName: string
	values: readonly string[]
}
