import { MigrationBuilder } from '@contember/database-migrations'
import { Acl } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'

export const UpdateAclSchemaModification: ModificationHandlerStatic<UpdateAclSchemaModificationData> = class {
	public static id = 'updateAclSchema'

	constructor(private readonly data: UpdateAclSchemaModificationData) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return schema => ({
			...schema,
			acl: this.data.schema,
		})
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: 'Update ACL schema' }
	}

	static createModification(data: UpdateAclSchemaModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface UpdateAclSchemaModificationData {
	schema: Acl.Schema
}
