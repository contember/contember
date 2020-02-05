import { MigrationBuilder } from 'node-pg-migrate'
import { Schema, Model } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEveryEntity, updateEveryField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { isIt } from '../../utils/isIt'

class UpdateEntityNameModification implements Modification<UpdateEntityNameModification.Data> {
	constructor(private readonly data: UpdateEntityNameModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEveryEntity(
				updateEveryField(field => {
					if (isIt<Model.AnyRelation>(field, 'target') && field.target === this.data.entityName) {
						return { ...field, target: this.data.newEntityName }
					}
					return field
				}),
			),
			model => {
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
			},
		)
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
