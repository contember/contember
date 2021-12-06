import { MigrationBuilder } from '@contember/database-migrations'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { applyPatch, Operation } from 'rfc6902'
import deepCopy from '../../utils/deepCopy'

export const PatchValidationSchemaModification: ModificationHandlerStatic<PatchValidationSchemaModificationData> = class {
	static id = 'patchValidationSchema'
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

	static createModification(data: PatchValidationSchemaModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface PatchValidationSchemaModificationData {
	patch: Operation[]
}
