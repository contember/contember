import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class RemoveEnumModification implements Modification<RemoveEnumModification.Data> {
	constructor(private readonly data: RemoveEnumModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		builder.dropDomain(this.data.enumName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(model => {
			const { [this.data.enumName]: removedEnum, ...enums } = model.enums
			return {
				...model,
				enums,
			}
		})
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: `Remove ${this.data.enumName}` }
	}
}

namespace RemoveEnumModification {
	export const id = 'removeEnum'

	export interface Data {
		enumName: string
	}
}

export default RemoveEnumModification
