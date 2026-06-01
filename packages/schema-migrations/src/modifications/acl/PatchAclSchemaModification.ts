import { SchemaUpdater } from '../utils/schemaUpdateUtils.js'
import { createModificationType, ModificationHandler } from '../ModificationHandler.js'
import { applyPatch, Operation } from 'rfc6902'
import deepCopy from '../../utils/deepCopy.js'

export class PatchAclSchemaModificationHandler implements ModificationHandler<PatchAclSchemaModificationData> {
	constructor(private readonly data: PatchAclSchemaModificationData) {}

	public createSql(): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			const acl = deepCopy(schema.acl)
			const result = applyPatch(acl, this.data.patch).filter(it => it !== null)
			if (result.length > 0) {
				throw result[0]
			}

			return {
				...schema,
				acl,
			}
		}
	}

	describe() {
		return { message: 'Update ACL schema' }
	}
}

export const patchAclSchemaModification = createModificationType({
	id: 'patchAclSchema',
	handler: PatchAclSchemaModificationHandler,
})

export interface PatchAclSchemaModificationData {
	patch: Operation[]
}
