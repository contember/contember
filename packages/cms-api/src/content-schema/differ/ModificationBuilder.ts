import { Model, deepCopy } from 'cms-common'
import { SchemaDiff, Modification, CreateEntityModification } from './modifications'
import { acceptFieldVisitor } from '../modelUtils'
import CreateModificationFieldVisitor from './CreateModificationFieldVisitor'

export default class ModificationBuilder {
	private readonly entities: CreateEntityModification[] = []
	private readonly modifications: Modification[] = []

	constructor(private readonly originalSchema: Model.Schema, private readonly updatedSchema: Model.Schema) {}

	public getDiff(): SchemaDiff | null {
		const diff = {
			modifications: [...this.entities, ...this.modifications],
		}
		return diff.modifications.length > 0 ? diff : null
	}

	public createEntity(updatedEntity: Model.Entity) {
		this.entities.push({
			modification: 'createEntity',
			entity: {
				name: updatedEntity.name,
				primary: updatedEntity.primary,
				primaryColumn: updatedEntity.primaryColumn,
				tableName: updatedEntity.tableName,
				fields: {
					[updatedEntity.primary]: deepCopy(updatedEntity.fields[updatedEntity.primary]),
				},
				unique: {},
			},
		})
	}

	public removeEntity(entityName: string) {
		this.modifications.push({
			modification: 'removeEntity',
			entityName: entityName,
		})
	}

	public updateEntityTableName(entityName: string, tableName: string) {
		this.modifications.push({
			modification: 'updateEntityTableName',
			entityName: entityName,
			tableName: tableName,
		})
	}

	public createField(updatedEntity: Model.Entity, fieldName: string) {
		const modification = acceptFieldVisitor(
			this.updatedSchema,
			updatedEntity,
			fieldName,
			new CreateModificationFieldVisitor(updatedEntity)
		)
		if (modification != null) {
			this.modifications.push(modification)
		}
	}

	public removeField(entityName: string, fieldName: string) {
		this.modifications.push({
			modification: 'removeField',
			entityName: entityName,
			fieldName: fieldName,
		})
	}

	public updateColumnName(entityName: string, fieldName: string, columnName: string) {
		this.modifications.push({
			modification: 'updateColumnName',
			entityName: entityName,
			fieldName: fieldName,
			columnName: columnName,
		})
	}

	public updateColumnDefinition(entityName: string, fieldName: string, definition: Model.AnyColumnDefinition) {
		this.modifications.push({
			modification: 'updateColumnDefinition',
			entityName: entityName,
			fieldName: fieldName,
			definition: definition,
		})
	}

	public createUnique(updatedEntity: Model.Entity, uniqueName: string) {
		const unique = updatedEntity.unique[uniqueName]
		this.modifications.push({
			modification: 'createUniqueConstraint',
			entityName: updatedEntity.name,
			unique: deepCopy(unique),
		})
	}

	public removeUnique(entityName: string, uniqueName: string) {
		this.modifications.push({
			modification: 'removeUniqueConstraint',
			entityName: entityName,
			constraintName: uniqueName,
		})
	}

	public createEnum(enumName: string) {
		this.modifications.push({
			modification: 'createEnum',
			enumName: enumName,
			values: deepCopy(this.updatedSchema.enums[enumName]),
		})
	}

	public removeEnum(enumName: string) {
		this.modifications.push({
			modification: 'removeEnum',
			enumName: enumName,
		})
	}

	public updateEnum(enumName: string) {
		this.modifications.push({
			modification: 'updateEnum',
			enumName: enumName,
			values: deepCopy(this.updatedSchema.enums[enumName]),
		})
	}
}
