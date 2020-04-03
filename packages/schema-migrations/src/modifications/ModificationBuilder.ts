import { Acl, Model, Schema, Validation } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import CreateModificationFieldVisitor from '../CreateModificationFieldVisitor'
import Migration from '../Migration'
import PatchAclSchemaModification from './acl/PatchAclSchemaModification'
import { Operation } from 'rfc6902'
import UpdateAclSchemaModification from './acl/UpdateAclSchemaModification'
import CreateColumnModification from './columns/CreateColumnModification'
import UpdateColumnDefinitionModification from './columns/UpdateColumnDefinitionModification'
import UpdateColumnNameModification from './columns/UpdateColumnNameModification'
import CreateUniqueConstraintModification from './constraints/CreateUniqueConstraintModification'
import RemoveUniqueConstraintModification from './constraints/RemoveUniqueConstraintModification'
import CreateEntityModification from './entities/CreateEntityModification'
import RemoveEntityModification from './entities/RemoveEntityModification'
import UpdateEntityNameModification from './entities/UpdateEntityNameModification'
import UpdateEntityTableNameModification from './entities/UpdateEntityTableNameModification'
import CreateEnumModification from './enums/CreateEnumModification'
import RemoveEnumModification from './enums/RemoveEnumModification'
import UpdateEnumModification from './enums/UpdateEnumModification'
import RemoveFieldModification from './fields/RemoveFieldModification'
import UpdateFieldNameModification from './fields/UpdateFieldNameModification'
import CreateRelationInverseSideModification from './relations/CreateRelationInverseSideModification'
import CreateRelationModification from './relations/CreateRelationModification'
import UpdateRelationOnDeleteModification from './relations/UpdateRelationOnDeleteModification'
import UpdateValidationSchemaModification from './validation/UpdateValidationSchemaModification'
import PatchValidationSchemaModification from './validation/PatchValidationSchemaModification'
import deepCopy from '../utils/deepCopy'
import MakeRelationNotNullModification from './relations/MakeRelationNotNullModification'
import UpdateRelationOrderByModification from './relations/UpdateRelationOrderByModification'

class ModificationBuilder {
	private modifications: Migration.Modification[] = []

	constructor(private readonly originalSchema: Schema, private readonly updatedSchema: Schema) {}

	public getDiff(): Migration.Modification[] {
		const order = [
			null,
			RemoveUniqueConstraintModification.id,
			RemoveFieldModification.id,
			RemoveEntityModification.id,

			UpdateEntityNameModification.id,
			UpdateEntityTableNameModification.id,
			UpdateFieldNameModification.id,
			UpdateColumnDefinitionModification.id,
			UpdateColumnNameModification.id,
			UpdateRelationOnDeleteModification.id,
			UpdateRelationOrderByModification.id,
			MakeRelationNotNullModification.id,
			UpdateEnumModification.id,

			CreateEnumModification.id,
			CreateEntityModification.id,
			CreateColumnModification.id,
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
			[RemoveFieldModification.id]: (a: RemoveFieldModification.Data, b: RemoveFieldModification.Data) => {
				const visitor: Model.FieldVisitor<number> = {
					visitColumn: () => 0,
					visitManyHasOne: () => 10,
					visitOneHasMany: () => 0,
					visitOneHasOneOwner: () => 10,
					visitOneHasOneInversed: () => 0,
					visitManyHasManyOwner: () => 10,
					visitManyHasManyInversed: () => 0,
				}
				return (
					acceptFieldVisitor(this.originalSchema.model, a.entityName, a.fieldName, visitor) -
					acceptFieldVisitor(this.originalSchema.model, b.entityName, b.fieldName, visitor)
				)
			},
		}
		const modifications = this.modifications.filter(it => {
			if (it.modification === CreateRelationInverseSideModification.id) {
				// remove creation of inversed side if owning side is created
				const relation = (it as Migration.Modification<CreateRelationInverseSideModification.Data>).relation
				return !this.modifications.find(
					it =>
						it.modification === CreateRelationModification.id &&
						(it as Migration.Modification<CreateRelationModification.Data>).inverseSide === relation,
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
			modification: RemoveEntityModification.id,
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
		const visitor: Model.FieldVisitor<Migration.Modification> = new CreateModificationFieldVisitor()
		const modification = acceptFieldVisitor(this.updatedSchema.model, updatedEntity, fieldName, visitor)
		if (modification != null) {
			this.modifications.push(modification)
		}
	}

	public removeField(entityName: string, fieldName: string, prepend: boolean = false) {
		const modification = {
			modification: 'removeField',
			entityName: entityName,
			fieldName: fieldName,
		}
		if (prepend) {
			this.modifications.unshift(modification)
		} else {
			this.modifications.push(modification)
		}
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

	public makeRelationNotNull(entityName: string, fieldName: string) {
		this.modifications.push({
			modification: MakeRelationNotNullModification.id,
			entityName,
			fieldName,
		})
	}

	public updateRelationOrderBy(entityName: string, fieldName: string, orderBy: Model.OrderBy[]) {
		this.modifications.push({
			modification: UpdateRelationOrderByModification.id,
			entityName,
			fieldName,
			orderBy,
		})
	}

	public updateAclSchema(schema: Acl.Schema) {
		this.modifications.push({
			modification: 'updateAclSchema',
			schema,
		})
	}

	public patchAclSchema(patch: Operation[]) {
		this.modifications.push({
			modification: PatchAclSchemaModification.id,
			patch,
		})
	}

	public updateValidationSchema(schema: Validation.Schema) {
		this.modifications.push({
			modification: 'updateValidationSchema',
			schema,
		})
	}

	public patchValidationSchema(patch: Operation[]) {
		this.modifications.push({
			modification: PatchValidationSchemaModification.id,
			patch,
		})
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
