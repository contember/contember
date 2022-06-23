import { MigrationBuilder } from '@contember/database-migrations'
import { Acl, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils.js'
import { ModificationHandlerStatic } from '../ModificationHandler.js'
import deepEqual from 'fast-deep-equal'
import { createPatch } from 'rfc6902'
import { PatchAclSchemaModification } from './PatchAclSchemaModification.js'

export const UpdateAclSchemaModification: ModificationHandlerStatic<UpdateAclSchemaModificationData> = class {
	public static id = 'updateAclSchema'

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

	static createModification(data: UpdateAclSchemaModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		if (deepEqual(originalSchema.acl, updatedSchema.acl)) {
			return []
		}
		const patch = createPatch(originalSchema.acl, updatedSchema.acl)
		if (patch.length <= 100) {
			return [PatchAclSchemaModification.createModification({ patch })]
		}
		return [UpdateAclSchemaModification.createModification({ schema: updatedSchema.acl })]
	}
}

export interface UpdateAclSchemaModificationData {
	schema: Acl.Schema
}
