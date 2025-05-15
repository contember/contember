import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { createCheck, getConstraintName } from './enumUtils'
import { getColumnSqlType } from '../utils/columnUtils'

export class UpdateEnumModificationHandler implements ModificationHandler<UpdateEnumModificationData> {
	constructor(private readonly data: UpdateEnumModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		if (!this.requiresNewDomain()) {
			builder.sql(`
				ALTER DOMAIN "${this.data.enumName}"
				DROP CONSTRAINT ${getConstraintName(this.data.enumName)}`)
			builder.sql(`
				ALTER DOMAIN "${this.data.enumName}"
				ADD CONSTRAINT ${getConstraintName(this.data.enumName)} CHECK (${createCheck(this.data.values)})`)
		} else {
			/**
			 * Because postgres does not support altering domain constrains
			 * when used in composite types (like arrays) we need to:
			 * - create a new domain with the new constraint
			 * - update all the columns using the old domain to use the new domain
			 * - drop the old domain and rename the new domain to the old name
			 */
			const oldName = `${this.data.enumName}__old`
			builder.renameDomain(this.data.enumName, oldName)

			builder.createDomain(this.data.enumName, 'text', {
				check: createCheck(this.data.values),
				constraintName: getConstraintName(this.data.enumName),
			})
			for (const entity of Object.values(this.schema.model.entities)) {
				for (const field of Object.values(entity.fields)) {
					if (field.type === Model.ColumnType.Enum && field.columnType === this.data.enumName) {
						builder.alterColumn(entity.tableName, field.columnName, {
							type: getColumnSqlType(field),
						})
					}
				}
			}

			builder.dropDomain(oldName)
		}
	}

	private requiresNewDomain(): boolean {
		return Object.values(this.schema.model.entities).some(it => {
			return Object.values(it.fields).some(field => {
				return field.type === Model.ColumnType.Enum && field.columnType === this.data.enumName && field.list
			})
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(({ model }) => ({
			...model,
			enums: {
				...model.enums,
				[this.data.enumName]: this.data.values,
			},
		}))
	}

	describe() {
		const currentValues = this.schema.model.enums[this.data.enumName]
		const missingValues = currentValues.filter(it => !this.data.values.includes(it))
		const failureWarning =
			missingValues.length > 0
				? `Removing values (${missingValues.join(', ')}) from enum, this may fail in runtime`
				: undefined
		return { message: `Update enum ${this.data.enumName}`, failureWarning }
	}
}

export interface UpdateEnumModificationData {
	enumName: string
	values: readonly string[]
}

export const updateEnumModification = createModificationType({
	id: 'updateEnum',
	handler: UpdateEnumModificationHandler,
})

export class UpdateEnumDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.model.enums)
			.filter(
				([name]) =>
					originalSchema.model.enums[name] &&
					!deepEqual(updatedSchema.model.enums[name], originalSchema.model.enums[name]),
			)
			.map(([enumName, values]) => updateEnumModification.createModification({ enumName, values }))
	}
}
