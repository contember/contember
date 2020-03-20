import { MigrationBuilder } from 'node-pg-migrate'
import { Acl } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class UpdateAclSchemaModification implements Modification<UpdateAclSchemaModification.Data> {
	constructor(private readonly data: UpdateAclSchemaModification.Data) {}

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
}

namespace UpdateAclSchemaModification {
	export const id = 'updateAclSchema'

	export interface Data {
		schema: Acl.Schema
	}
}

export default UpdateAclSchemaModification
