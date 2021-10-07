import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { escapeSqlString } from '../../utils/escapeSqlString'
import { createCheck, getConstraintName } from './enumUtils'

export const CreateEnumModification: ModificationHandlerStatic<CreateEnumModificationData> = class {
	static id = 'createEnum'
	constructor(private readonly data: CreateEnumModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
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
				[this.data.enumName]: this.data.values,
			},
		}))
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: `Add enum ${this.data.enumName}` }
	}

	static createModification(data: CreateEnumModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.model.enums)
			.filter(([name]) => !originalSchema.model.enums[name])
			.map(([enumName, values]) => CreateEnumModification.createModification({ enumName, values }))
	}
}

export interface CreateEnumModificationData {
	enumName: string
	values: string[]
}
