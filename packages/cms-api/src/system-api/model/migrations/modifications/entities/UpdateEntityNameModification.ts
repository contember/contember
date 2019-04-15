import { MigrationBuilder } from 'node-pg-migrate'
import { Schema } from 'cms-common'
import { ContentEvent } from '../../../dtos/Event'
import { SchemaUpdater, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'

class UpdateEntityNameModification implements Modification<UpdateEntityNameModification.Data> {
	constructor(private readonly data: UpdateEntityNameModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(model => {
			const { [this.data.entityName]: renamed, ...entities } = model.entities
			return {
				...model,
				entities: {
					...entities,
					[this.data.newEntityName]: {
						...renamed,
						name: this.data.newEntityName,
					},
				},
			}
		})
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}
}

namespace UpdateEntityNameModification {
	export const id = 'updateEntityName'

	export interface Data {
		entityName: string
		newEntityName: string
	}
}

export default UpdateEntityNameModification
