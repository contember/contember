import { deepCopy, Model, Schema, Acl } from 'cms-common'
import { Modification, SchemaDiff } from './modifications'
import { acceptFieldVisitor } from '../modelUtils'
import CreateModificationFieldVisitor from './CreateModificationFieldVisitor'
import { arraySplit } from '../../utils/arrays'

class ModificationBuilder {
	private modifications: Modification[] = []

	constructor(private readonly originalSchema: Schema, private readonly updatedSchema: Schema) {}

	public getDiff(): SchemaDiff | null {
		const [createEntity, other] = arraySplit(this.modifications, it => it.modification === 'createEntity')
		const diff = {
			modifications: [...createEntity, ...other],
		}
		return diff.modifications.length > 0 ? diff : null
	}

	public createEntity(updatedEntity: Model.Entity) {
		this.modifications.push({
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
			this.updatedSchema.model,
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
			values: deepCopy(this.updatedSchema.model.enums[enumName]),
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
			values: deepCopy(this.updatedSchema.model.enums[enumName]),
		})
	}

	public updateRelationOnDelete(entityName: string, fieldName: string, onDelete: Model.OnDelete) {
		this.modifications.push({
			modification: 'updateRelationOnDelete',
			entityName,
			fieldName,
			onDelete,
		})
	}

	public updateAclSchema(schema: Acl.Schema) {
		this.modifications.push({
			modification: 'updateAclSchema',
			schema,
		})
	}

	public createMarker(): ModificationBuilder.Marker {
		return new ModificationBuilder.Marker(this, [...this.modifications])
	}

	public rewind(modifications: Modification[]) {
		this.modifications = modifications
	}
}

namespace ModificationBuilder {
	export class Marker {
		constructor(private readonly builder: ModificationBuilder, public readonly modifications: Modification[]) {}

		public rewind() {
			this.builder.rewind(this.modifications)
		}
	}
}

export default ModificationBuilder
