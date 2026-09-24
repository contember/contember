import { SchemaUpdater } from '../utils/schemaUpdateUtils.js'
import { createModificationType, ModificationHandler } from '../ModificationHandler.js'
import { Operation } from 'rfc6902'
import { applyPatchCopyOnWrite } from '../../utils/applyPatchCopyOnWrite.js'

export class PatchAclSchemaModificationHandler implements ModificationHandler<PatchAclSchemaModificationData> {
	constructor(private readonly data: PatchAclSchemaModificationData) {}

	public createSql(): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			const { result: acl, errors } = applyPatchCopyOnWrite(schema.acl, this.data.patch)
			if (errors.length > 0) {
				throw errors[0]
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
