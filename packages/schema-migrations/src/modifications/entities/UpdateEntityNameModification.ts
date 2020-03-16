import { MigrationBuilder } from 'node-pg-migrate'
import { Schema, Model } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import {
	SchemaUpdater,
	updateAcl,
	updateAclEntities,
	updateEveryField,
	updateAclEveryRole,
	updateModel,
	updateSchema,
	updateEveryEntity,
} from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { isIt } from '../../utils/isIt'
import { VERSION_ACL_PATCH } from '../ModificationVersions'

class UpdateEntityNameModification implements Modification<UpdateEntityNameModification.Data> {
	constructor(
		private readonly data: UpdateEntityNameModification.Data,
		private readonly schema: Schema,
		private readonly formatVersion: number,
	) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return updateSchema(
			updateModel(
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
			),
			this.formatVersion >= VERSION_ACL_PATCH
				? updateAcl(
						updateAclEveryRole(
							updateAclEntities(entities => {
								if (!entities[this.data.entityName]) {
									return entities
								}
								const { [this.data.entityName]: renamed, ...other } = entities
								return {
									[this.data.newEntityName]: renamed,
									...other,
								}
							}),
						),
				  )
				: undefined,
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
