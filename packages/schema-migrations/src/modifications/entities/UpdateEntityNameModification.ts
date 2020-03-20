import { MigrationBuilder } from 'node-pg-migrate'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import {
	SchemaUpdater,
	updateAcl,
	updateAclEntities,
	updateAclEveryRole,
	updateEntity,
	updateEveryEntity,
	updateEveryField,
	updateModel,
	updateSchema,
} from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { isIt } from '../../utils/isIt'
import { VERSION_ACL_PATCH, VERSION_UPDATE_CONSTRAINT_NAME } from '../ModificationVersions'
import { NamingHelper } from '@contember/schema-utils'
import UpdateEntityTableNameModification from './UpdateEntityTableNameModification'
import { NoopModification } from '../NoopModification'
import { renameConstraintSchemaUpdater, renameConstraintsSqlBuilder } from '../utils/renameConstraintsHelper'
import { changeValue } from '../utils/valueUtils'

class UpdateEntityNameModification implements Modification<UpdateEntityNameModification.Data> {
	private subModification: Modification<any>

	constructor(
		private readonly data: UpdateEntityNameModification.Data,
		private readonly schema: Schema,
		private readonly formatVersion: number,
	) {
		this.subModification = data.tableName
			? new UpdateEntityTableNameModification({ entityName: data.entityName, tableName: data.tableName }, schema)
			: new NoopModification()
	}

	public createSql(builder: MigrationBuilder): void {
		if (this.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME) {
			const entity = this.schema.model.entities[this.data.entityName]
			renameConstraintsSqlBuilder(builder, entity, this.getNewConstraintName.bind(this))
		}
		this.subModification.createSql(builder)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateSchema(
			this.subModification.getSchemaUpdater(),
			updateModel(
				updateEveryEntity(
					updateEveryField(field => {
						if (isIt<Model.AnyRelation>(field, 'target') && field.target === this.data.entityName) {
							return { ...field, target: this.data.newEntityName }
						}
						return field
					}),
				),
				this.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME
					? updateEntity(this.data.entityName, renameConstraintSchemaUpdater(this.getNewConstraintName.bind(this)))
					: undefined,
				model => {
					const { [this.data.entityName]: renamed, ...entities } = model.entities
					const newEntities = {
						...entities,
						[this.data.newEntityName]: {
							...renamed,
							name: this.data.newEntityName,
						},
					}
					return {
						...model,
						entities: newEntities,
					}
				},
			),
			this.formatVersion >= VERSION_ACL_PATCH
				? updateAcl(
						updateAclEveryRole(
							role => ({
								...role,
								variables: Object.fromEntries(
									Object.entries(role.variables).map(([key, variable]) => [
										key,
										{
											...variable,
											entityName: changeValue(this.data.entityName, this.data.newEntityName)(variable.entityName),
										},
									]),
								),
							}),
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

	public async transformEvents(events: ContentEvent[]): Promise<ContentEvent[]> {
		events = await this.subModification.transformEvents(events)
		return events
	}

	private getNewConstraintName(constraint: Model.UniqueConstraint): string | null {
		const generatedName = NamingHelper.createUniqueConstraintName(this.data.entityName, constraint.fields)
		const isGenerated = constraint.name === generatedName
		if (!isGenerated) {
			null
		}
		return NamingHelper.createUniqueConstraintName(this.data.newEntityName, constraint.fields)
	}

	describe() {
		return { message: `Change entity name from ${this.data.entityName} to ${this.data.newEntityName}` }
	}
}

namespace UpdateEntityNameModification {
	export const id = 'updateEntityName'

	export interface Data {
		entityName: string
		newEntityName: string
		tableName?: string
	}
}

export default UpdateEntityNameModification
