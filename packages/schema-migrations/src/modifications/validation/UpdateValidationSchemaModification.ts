import { MigrationBuilder } from '@contember/database-migrations'
import { Schema, Validation } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { createPatch } from 'rfc6902'
import { PatchAclSchemaModification } from '../acl'
import { PatchValidationSchemaModification } from './PatchValidationSchemaModification'

export const UpdateValidationSchemaModification: ModificationHandlerStatic<UpdateValidationSchemaModificationData> = class {
	static id = 'updateValidationSchema'
	constructor(private readonly data: UpdateValidationSchemaModificationData) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => ({
			...schema,
			validation: this.data.schema,
		})
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: 'Update validation schema' }
	}

	static createModification(data: UpdateValidationSchemaModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		if (deepEqual(originalSchema.validation, updatedSchema.validation)) {
			return []
		}
		const patch = createPatch(originalSchema.validation, updatedSchema.validation)
		if (patch.length <= 20) {
			return [PatchValidationSchemaModification.createModification({ patch })]
		}
		return [UpdateValidationSchemaModification.createModification({ schema: updatedSchema.validation })]
	}
}

export interface UpdateValidationSchemaModificationData {
	schema: Validation.Schema
}
