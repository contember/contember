import { MigrationBuilder } from '@contember/database-migrations'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { applyPatch, Operation } from 'rfc6902'
import deepCopy from '../../utils/deepCopy'

export const PatchAclSchemaModification: ModificationHandlerStatic<PatchAclSchemaModificationData> = class {
	static id = 'patchAclSchema'

	constructor(private readonly data: PatchAclSchemaModificationData) {}

	public createSql(builder: MigrationBuilder): void {}

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

	static createModification(data: PatchAclSchemaModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface PatchAclSchemaModificationData {
	patch: Operation[]
}
