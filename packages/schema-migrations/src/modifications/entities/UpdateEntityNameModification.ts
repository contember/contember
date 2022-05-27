import { MigrationBuilder } from '@contember/database-migrations'
import { Acl, Model, Schema } from '@contember/schema'
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
} from '../utils/schemaUpdateUtils'
import { createModificationType, ModificationHandler, ModificationHandlerOptions } from '../ModificationHandler'
import { isIt } from '../../utils/isIt'
import { VERSION_ACL_PATCH, VERSION_UPDATE_CONSTRAINT_NAME } from '../ModificationVersions'
import { NamingHelper } from '@contember/schema-utils'
import { NoopModification } from '../NoopModification'
import { renameConstraintSchemaUpdater, renameConstraintsSqlBuilder } from '../utils/renameConstraintsHelper'
import { changeValue } from '../utils/valueUtils'
import { updateEntityTableNameModification } from './UpdateEntityTableNameModification'

export class UpdateEntityNameModificationHandler implements ModificationHandler<UpdateEntityNameModificationData> {
	private subModification: ModificationHandler<any>

	constructor(
		protected readonly data: UpdateEntityNameModificationData,
		protected readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {
		this.subModification = data.tableName
			? updateEntityTableNameModification.createHandler(
				{ entityName: data.entityName, tableName: data.tableName },
				schema,
				this.options,
			  )
			: new NoopModification()
	}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (!entity.view && this.options.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME) {
			renameConstraintsSqlBuilder(builder, entity, this.getNewConstraintName.bind(this))
		}
		this.subModification.createSql(builder)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateSchema(
			this.subModification.getSchemaUpdater(),
			updateModel(
				updateEveryEntity(
					updateEveryField(({ field }) => {
						if (isIt<Model.AnyRelation>(field, 'target') && field.target === this.data.entityName) {
							return { ...field, target: this.data.newEntityName }
						}
						return field
					}),
				),
				this.options.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME
					? updateEntity(this.data.entityName, renameConstraintSchemaUpdater(this.getNewConstraintName.bind(this)))
					: undefined,
				({ model }) => {
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
			this.options.formatVersion >= VERSION_ACL_PATCH
				? updateAcl(
					updateAclEveryRole(
						({ role }) => ({
							...role,
							variables: Object.fromEntries(
								Object.entries(role.variables).map(([key, variable]) => {
									if (variable.type === Acl.VariableType.entity) {
										return [
											key,
											{
												...variable,
												entityName: changeValue(this.data.entityName, this.data.newEntityName)(variable.entityName),
											},
										]
									}
									return [key, variable]
								}),
							),
						}),
						updateAclEntities(({ entities }) => {
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

export interface UpdateEntityNameModificationData {
	entityName: string
	newEntityName: string
	tableName?: string
}

export const updateEntityNameModification = createModificationType({
	id: 'updateEntityName',
	handler: UpdateEntityNameModificationHandler,
})
