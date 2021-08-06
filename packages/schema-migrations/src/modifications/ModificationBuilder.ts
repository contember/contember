import { Acl, Model, Schema, Validation } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import CreateModificationFieldVisitor from './CreateModificationFieldVisitor'
import { Migration } from '../Migration'
import { Operation } from 'rfc6902'
import deepCopy from '../utils/deepCopy'
import { CreateUniqueConstraintModification, RemoveUniqueConstraintModification } from './constraints'
import { RemoveFieldModification, RemoveFieldModificationData, UpdateFieldNameModification } from './fields'
import {
	CreateEntityModification,
	RemoveEntityModification,
	UpdateEntityNameModification,
	UpdateEntityTableNameModification,
} from './entities'
import { CreateEnumModification, RemoveEnumModification, UpdateEnumModification } from './enums'
import { CreateColumnModification, UpdateColumnDefinitionModification, UpdateColumnNameModification } from './columns'
import {
	CreateRelationInverseSideModification,
	CreateRelationInverseSideModificationData,
	CreateRelationModification,
	CreateRelationModificationData,
	DisableOrphanRemovalModification,
	EnableOrphanRemovalModification,
	MakeRelationNotNullModification,
	MakeRelationNullableModification,
	UpdateRelationOnDeleteModification,
	UpdateRelationOrderByModification,
} from './relations'
import { PatchAclSchemaModification, UpdateAclSchemaModification } from './acl'
import { PatchValidationSchemaModification, UpdateValidationSchemaModification } from './validation'

class ModificationBuilder {
	private modifications: Migration.Modification[] = []

	constructor(private readonly originalSchema: Schema, private readonly updatedSchema: Schema) {}

	public getDiff(): Migration.Modification[] {
		const order = [
			null,
			RemoveUniqueConstraintModification.id,
			RemoveFieldModification.id,
			RemoveEntityModification.id,
			CreateEnumModification.id,

			UpdateEntityNameModification.id,
			UpdateEntityTableNameModification.id,
			UpdateFieldNameModification.id,
			UpdateColumnDefinitionModification.id,
			UpdateColumnNameModification.id,
			UpdateRelationOnDeleteModification.id,
			MakeRelationNotNullModification.id,
			MakeRelationNullableModification.id,
			EnableOrphanRemovalModification.id,
			DisableOrphanRemovalModification.id,
			UpdateEnumModification.id,

			CreateEntityModification.id,
			CreateColumnModification.id,
			UpdateRelationOrderByModification.id,
			CreateRelationInverseSideModification.id,
			CreateRelationModification.id,

			CreateUniqueConstraintModification.id,

			RemoveEnumModification.id,

			UpdateAclSchemaModification.id,
			PatchAclSchemaModification.id,

			UpdateValidationSchemaModification.id,
			PatchValidationSchemaModification.id,
		]
		const modificationSorters: Record<string, (a: any, b: any) => number> = {
			[RemoveFieldModification.id]: (a: RemoveFieldModificationData, b: RemoveFieldModificationData) => {
				const visitor: Model.FieldVisitor<number> = {
					visitColumn: () => 0,
					visitManyHasOne: () => 10,
					visitOneHasMany: () => 0,
					visitOneHasOneOwning: () => 10,
					visitOneHasOneInverse: () => 0,
					visitManyHasManyOwning: () => 10,
					visitManyHasManyInverse: () => 0,
				}
				return (
					acceptFieldVisitor(this.originalSchema.model, a.entityName, a.fieldName, visitor) -
					acceptFieldVisitor(this.originalSchema.model, b.entityName, b.fieldName, visitor)
				)
			},
		}
		const modifications = this.modifications.filter(it => {
			if (it.modification === CreateRelationInverseSideModification.id) {
				// remove creation of inverse side if owning side is created
				const relation = (it as Migration.Modification<CreateRelationInverseSideModificationData>).relation
				return !this.modifications.find(
					it =>
						it.modification === CreateRelationModification.id &&
						(it as Migration.Modification<CreateRelationModificationData>).inverseSide === relation,
				)
			}
			return true
		})

		return modifications.sort((a, b) => {
			const cmp =
				(order.indexOf(a.modification) || Number.MAX_SAFE_INTEGER) -
				(order.indexOf(b.modification) || Number.MAX_SAFE_INTEGER)
			if (cmp === 0 && modificationSorters[a.modification]) {
				return modificationSorters[a.modification](a, b)
			}
			return cmp
		})
	}

	public createEntity(updatedEntity: Model.Entity) {
		this.modifications.push(
			CreateEntityModification.createModification({
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
			}),
		)
	}

	public removeEntity(entityName: string) {
		this.modifications.push(
			RemoveEntityModification.createModification({
				entityName: entityName,
			}),
		)
	}

	public updateEntityTableName(entityName: string, tableName: string) {
		this.modifications.push(
			UpdateEntityTableNameModification.createModification({
				entityName: entityName,
				tableName: tableName,
			}),
		)
	}

	public createField(updatedEntity: Model.Entity, fieldName: string) {
		const visitor: Model.FieldVisitor<Migration.Modification> = new CreateModificationFieldVisitor()
		const modification = acceptFieldVisitor(this.updatedSchema.model, updatedEntity, fieldName, visitor)
		if (modification != null) {
			this.modifications.push(modification)
		}
	}

	public removeField(entityName: string, fieldName: string) {
		this.modifications.push(
			RemoveFieldModification.createModification({
				entityName: entityName,
				fieldName: fieldName,
			}),
		)
	}

	public updateColumnName(entityName: string, fieldName: string, columnName: string) {
		this.modifications.push(
			UpdateColumnNameModification.createModification({
				entityName: entityName,
				fieldName: fieldName,
				columnName: columnName,
			}),
		)
	}

	public updateColumnDefinition(entityName: string, fieldName: string, definition: Model.AnyColumn) {
		this.modifications.push(
			UpdateColumnDefinitionModification.createModification({
				entityName: entityName,
				fieldName: fieldName,
				definition: definition,
			}),
		)
	}

	public createUnique(updatedEntity: Model.Entity, uniqueName: string) {
		const unique = updatedEntity.unique[uniqueName]
		this.modifications.push(
			CreateUniqueConstraintModification.createModification({
				entityName: updatedEntity.name,
				unique: deepCopy(unique),
			}),
		)
	}

	public removeUnique(entityName: string, uniqueName: string) {
		this.modifications.push(
			RemoveUniqueConstraintModification.createModification({
				entityName: entityName,
				constraintName: uniqueName,
			}),
		)
	}

	public createEnum(enumName: string) {
		this.modifications.push(
			CreateEnumModification.createModification({
				enumName: enumName,
				values: deepCopy(this.updatedSchema.model.enums[enumName]),
			}),
		)
	}

	public removeEnum(enumName: string) {
		this.modifications.push(
			RemoveEnumModification.createModification({
				enumName: enumName,
			}),
		)
	}

	public updateEnum(enumName: string) {
		this.modifications.push(
			UpdateEnumModification.createModification({
				enumName: enumName,
				values: deepCopy(this.updatedSchema.model.enums[enumName]),
			}),
		)
	}

	public updateRelationOnDelete(entityName: string, fieldName: string, onDelete: Model.OnDelete) {
		this.modifications.push(
			UpdateRelationOnDeleteModification.createModification({
				entityName,
				fieldName,
				onDelete,
			}),
		)
	}

	public makeRelationNotNull(entityName: string, fieldName: string) {
		this.modifications.push(
			MakeRelationNotNullModification.createModification({
				entityName,
				fieldName,
			}),
		)
	}

	public makeRelationNullable(entityName: string, fieldName: string) {
		this.modifications.push(
			MakeRelationNullableModification.createModification({
				entityName,
				fieldName,
			}),
		)
	}

	public updateRelationOrderBy(entityName: string, fieldName: string, orderBy: Model.OrderBy[]) {
		this.modifications.push(
			UpdateRelationOrderByModification.createModification({
				entityName,
				fieldName,
				orderBy,
			}),
		)
	}

	public enableOrphanRemoval(entityName: string, fieldName: string) {
		this.modifications.push(
			EnableOrphanRemovalModification.createModification({
				entityName,
				fieldName,
			}),
		)
	}

	public disableOrphanRemoval(entityName: string, fieldName: string) {
		this.modifications.push(
			DisableOrphanRemovalModification.createModification({
				entityName,
				fieldName,
			}),
		)
	}

	public updateAclSchema(schema: Acl.Schema) {
		this.modifications.push(
			UpdateAclSchemaModification.createModification({
				schema,
			}),
		)
	}

	public patchAclSchema(patch: Operation[]) {
		this.modifications.push(
			PatchAclSchemaModification.createModification({
				patch,
			}),
		)
	}

	public updateValidationSchema(schema: Validation.Schema) {
		this.modifications.push(
			UpdateValidationSchemaModification.createModification({
				schema,
			}),
		)
	}

	public patchValidationSchema(patch: Operation[]) {
		this.modifications.push(
			PatchValidationSchemaModification.createModification({
				patch,
			}),
		)
	}

	public createMarker(): ModificationBuilder.Marker {
		return new ModificationBuilder.Marker(this, [...this.modifications])
	}

	public rewind(modifications: Migration.Modification[]) {
		this.modifications = modifications
	}
}

namespace ModificationBuilder {
	export class Marker {
		constructor(
			private readonly builder: ModificationBuilder,
			public readonly modifications: Migration.Modification[],
		) {}

		public rewind() {
			this.builder.rewind(this.modifications)
		}
	}
}

export default ModificationBuilder
