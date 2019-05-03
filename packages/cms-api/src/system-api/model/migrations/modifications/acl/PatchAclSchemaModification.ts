import { MigrationBuilder } from 'node-pg-migrate'
import { deepCopy } from 'cms-common'
import { ContentEvent } from '../../../dtos/Event'
import { SchemaUpdater } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { applyPatch, Operation } from 'rfc6902'

class PatchAclSchemaModification implements Modification<PatchAclSchemaModification.Data> {
	constructor(private readonly data: PatchAclSchemaModification.Data) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return schema => {
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

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}
}

namespace PatchAclSchemaModification {
	export const id = 'patchAclSchema'

	export interface Data {
		patch: Operation[]
	}
}

export default PatchAclSchemaModification
