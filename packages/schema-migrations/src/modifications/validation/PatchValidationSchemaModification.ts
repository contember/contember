import { MigrationBuilder } from '@contember/database-migrations'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, ModificationHandler } from '../ModificationHandler'
import { applyPatch, Operation } from 'rfc6902'
import deepCopy from '../../utils/deepCopy'

export class PatchValidationSchemaModificationHandler implements ModificationHandler<PatchValidationSchemaModificationData> {
	constructor(private readonly data: PatchValidationSchemaModificationData) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			const validation = deepCopy(schema.validation)
			const result = applyPatch(validation, this.data.patch).filter(it => it !== null)
			if (result.length > 0) {
				throw result[0]
			}

			return {
				...schema,
				validation,
			}
		}
	}

	describe() {
		return { message: 'Update validation schema' }
	}
}

export interface PatchValidationSchemaModificationData {
	patch: Operation[]
}

export const patchValidationSchemaModification = createModificationType({
	id: 'patchValidationSchema',
	handler: PatchValidationSchemaModificationHandler,
})
