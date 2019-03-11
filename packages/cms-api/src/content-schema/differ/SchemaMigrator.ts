import { Model, deepCopy, assertNever, Acl, Schema } from 'cms-common'
import {
	SchemaDiff,
	Modification,
	CreateEntityModification,
	RemoveEntityModification,
	UpdateEntityTableNameModification,
	CreateColumnModification,
	CreateRelationModification,
	RemoveFieldModification,
	UpdateColumnNameModification,
	UpdateColumnDefinitionModification,
	CreateUniqueConstraintModification,
	RemoveUniqueConstraintModification,
	CreateEnumModification,
	RemoveEnumModification,
	UpdateEnumModification,
	UpdateEntityNameModification,
	UpdateFieldNameModification,
	CreateRelationInverseSideModification,
	UpdateRelationOnDeleteModification, UpdateAclSchemaModification,
} from './modifications'
import { acceptFieldVisitor } from '../modelUtils'
import { isIt } from '../../utils/type'

export default class SchemaMigrator {
	constructor(private readonly schema: Schema) {}

	public static applyDiff(schema: Schema, diff: SchemaDiff): Schema {
		schema = deepCopy(schema)
		const migrator = new SchemaMigrator(schema)
		for (const modification of diff.modifications) {
			migrator.apply(modification)
		}
		return schema
	}

	public apply(modification: Modification) {
		switch (modification.modification) {
			case 'createEntity':
				this.createEntity(modification)
				break
			case 'removeEntity':
				this.removeEntity(modification)
				break
			case 'updateEntityName':
				this.updateEntityName(modification)
				break
			case 'updateEntityTableName':
				this.updateEntityTableName(modification)
				break
			case 'createColumn':
				this.createColumn(modification)
				break
			case 'createRelation':
				this.createRelation(modification)
				break
			case 'createRelationInverseSide':
				this.createRelationInverseSide(modification)
				break
			case 'removeField':
				this.removeField(modification)
				break
			case 'updateFieldName':
				this.updateFieldName(modification)
				break
			case 'updateColumnName':
				this.updateColumnName(modification)
				break
			case 'updateColumnDefinition':
				this.updateColumnDefinition(modification)
				break
			case 'createUniqueConstraint':
				this.createUniqueConstraint(modification)
				break
			case 'removeUniqueConstraint':
				this.removeUniqueConstraint(modification)
				break
			case 'createEnum':
				this.createEnum(modification)
				break
			case 'removeEnum':
				this.removeEnum(modification)
				break
			case 'updateEnum':
				this.updateEnum(modification)
				break
			case 'updateRelationOnDelete':
				this.updateRelationOnDelete(modification)
				break
			case 'updateAclSchema':
				this.updateAclSchema(modification)
				break
			default:
				assertNever(modification)
		}
	}

	private createEntity(modification: CreateEntityModification) {
		this.schema.model.entities[modification.entity.name] = deepCopy(modification.entity)
	}

	private removeEntity(modification: RemoveEntityModification) {
		delete this.schema.model.entities[modification.entityName]
	}

	private updateEntityName(modification: UpdateEntityNameModification) {
		if (modification.entityName == modification.newEntityName) {
			return
		}
		this.schema.model.entities[modification.newEntityName] = {
			...deepCopy(this.schema.model.entities[modification.entityName]),
			name: modification.newEntityName,
		}
		delete this.schema.model.entities[modification.entityName]
	}

	private updateEntityTableName(modification: UpdateEntityTableNameModification) {
		this.schema.model.entities[modification.entityName].tableName = modification.tableName
	}

	private createColumn(modification: CreateColumnModification) {
		this.schema.model.entities[modification.entityName].fields[modification.field.name] = deepCopy(modification.field)
	}

	private createRelation(modification: CreateRelationModification) {
		const owningEntity = this.schema.model.entities[modification.entityName]
		owningEntity.fields[modification.owningSide.name] = deepCopy(modification.owningSide)
		if (typeof modification.inverseSide !== 'undefined') {
			const inverseEntity = this.schema.model.entities[modification.owningSide.target]
			inverseEntity.fields[modification.inverseSide.name] = deepCopy(modification.inverseSide)
		}
	}

	private createRelationInverseSide(modification: CreateRelationInverseSideModification) {
		const inverseEntity = this.schema.model.entities[modification.entityName]
		inverseEntity.fields[modification.relation.name] = deepCopy(modification.relation)
		const ownerEntity = this.schema.model.entities[modification.relation.target]
		const ownerRelation = ownerEntity.fields[modification.relation.ownedBy] as Model.OwnerRelation
		ownerRelation.inversedBy = modification.relation.name
	}

	private removeField(modification: RemoveFieldModification) {
		acceptFieldVisitor(this.schema.model, modification.entityName, modification.fieldName, {
			visitColumn: (entity, column) => {
				delete entity.fields[column.name]
			},
			visitRelation: (entity, relation, targetEntity, targetRelation) => {
				delete entity.fields[relation.name]
			},
		})
	}

	private updateFieldName(modification: UpdateFieldNameModification) {
		if (modification.fieldName == modification.newFieldName) {
			return
		}
		const entity = this.schema.model.entities[modification.entityName]
		entity.fields[modification.newFieldName] = {
			...deepCopy(entity.fields[modification.fieldName]),
			name: modification.newFieldName,
		}
		delete entity.fields[modification.fieldName]
	}

	private updateColumnName(modification: UpdateColumnNameModification) {
		const column = this.schema.model.entities[modification.entityName].fields[modification.fieldName] as Model.AnyColumn
		column.name = modification.columnName
	}

	private updateColumnDefinition(modification: UpdateColumnDefinitionModification) {
		const column = this.schema.model.entities[modification.entityName].fields[modification.fieldName] as Model.AnyColumn

		if (column.type === Model.ColumnType.Enum) {
			delete column.enumName
		}

		column.type = modification.definition.type
		column.columnType = modification.definition.columnType
		column.nullable = modification.definition.nullable
		if (modification.definition.default === undefined) {
			delete column.default
		} else {
			column.default = modification.definition.default
		}

		// second condition is just a type hint
		if (modification.definition.type === Model.ColumnType.Enum && column.type === Model.ColumnType.Enum) {
			column.enumName = modification.definition.enumName
		}
	}

	private createUniqueConstraint(modification: CreateUniqueConstraintModification) {
		this.schema.model.entities[modification.entityName].unique[modification.unique.name] = deepCopy(modification.unique)
	}

	private removeUniqueConstraint(modification: RemoveUniqueConstraintModification) {
		delete this.schema.model.entities[modification.entityName].unique[modification.constraintName]
	}

	private createEnum(modification: CreateEnumModification) {
		this.schema.model.enums[modification.enumName] = deepCopy(modification.values)
	}

	private removeEnum(modification: RemoveEnumModification) {
		delete this.schema.model.enums[modification.enumName]
	}

	private updateEnum(modification: UpdateEnumModification) {
		this.schema.model.enums[modification.enumName] = deepCopy(modification.values)
	}

	private updateRelationOnDelete(modification: UpdateRelationOnDeleteModification) {
		const field = this.schema.model.entities[modification.entityName].fields[modification.fieldName]
		if (!isIt<Model.JoiningColumnRelation>(field, 'joiningColumn')) {
			throw new Error()
		}
		field.joiningColumn.onDelete = modification.onDelete
	}

	private updateAclSchema(modification: UpdateAclSchemaModification)
	{
		this.schema.acl = modification.schema
	}
}
