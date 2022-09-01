import { MigrationBuilder } from '@contember/database-migrations'
import { Schema, Validation } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { createPatch } from 'rfc6902'
import { patchValidationSchemaModification } from './PatchValidationSchemaModification'

export class UpdateValidationSchemaModificationHandler implements ModificationHandler<UpdateValidationSchemaModificationData> {
	constructor(private readonly data: UpdateValidationSchemaModificationData) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => ({
			...schema,
			validation: this.data.schema,
		})
	}

	describe() {
		return { message: 'Update validation schema' }
	}

}

export interface UpdateValidationSchemaModificationData {
	schema: Validation.Schema
}

export const updateValidationSchemaModification = createModificationType({
	id: 'updateValidationSchema',
	handler: UpdateValidationSchemaModificationHandler,
})

export class UpdateValidationSchemaDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		if (deepEqual(originalSchema.validation, updatedSchema.validation)) {
			return []
		}
		const patch = createPatch(originalSchema.validation, updatedSchema.validation)
		if (patch.length <= 20) {
			return [patchValidationSchemaModification.createModification({ patch })]
		}
		return [updateValidationSchemaModification.createModification({ schema: updatedSchema.validation })]
	}
}
