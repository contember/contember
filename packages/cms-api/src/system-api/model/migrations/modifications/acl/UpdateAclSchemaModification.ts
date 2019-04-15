import { MigrationBuilder } from 'node-pg-migrate'
import { Acl } from 'cms-common'
import { ContentEvent } from '../../../dtos/Event'
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
}

namespace UpdateAclSchemaModification {
	export const id = 'updateAclSchema'

	export interface Data {
		schema: Acl.Schema
	}
}

export default UpdateAclSchemaModification
