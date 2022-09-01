import { MigrationBuilder } from '@contember/database-migrations'
import { Acl, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { createPatch } from 'rfc6902'
import { patchAclSchemaModification } from './PatchAclSchemaModification'

export class UpdateAclSchemaModificationHandler implements ModificationHandler<UpdateAclSchemaModificationData>{
	constructor(private readonly data: UpdateAclSchemaModificationData) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => ({
			...schema,
			acl: this.data.schema,
		})
	}

	describe() {
		return { message: 'Update ACL schema' }
	}
}

export interface UpdateAclSchemaModificationData {
	schema: Acl.Schema
}

export const updateAclSchemaModification = createModificationType({
	id: 'updateAclSchema',
	handler: UpdateAclSchemaModificationHandler,
})

export class UpdateAclSchemaDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		if (deepEqual(originalSchema.acl, updatedSchema.acl)) {
			return []
		}
		const patch = createPatch(originalSchema.acl, updatedSchema.acl)
		if (patch.length <= 100) {
			return [patchAclSchemaModification.createModification({ patch })]
		}
		return [updateAclSchemaModification.createModification({ schema: updatedSchema.acl })]
	}
}
