import { Model } from 'cms-common'

export interface CreateEntityModification {
	modification: 'createEntity'
	entity: Model.Entity
}

export interface RemoveEntityModification {
	modification: 'removeEntity'
	entityName: string
}

export interface UpdateEntityNameModification {
	modification: 'updateEntityName'
	entityName: string
	newEntityName: string
}

export interface UpdateEntityTableNameModification {
	modification: 'updateEntityTableName'
	entityName: string
	tableName: string
}

export interface CreateColumnModification {
	modification: 'createColumn'
	entityName: string
	field: Model.AnyColumn
}

export interface CreateRelationModification {
	modification: 'createRelation'
	entityName: string
	owningSide: Model.AnyRelation & Model.OwnerRelation
	inverseSide?: Model.AnyRelation & Model.InversedRelation
}

export interface CreateRelationInverseSideModification {
	modification: 'createRelationInverseSide'
	entityName: string
	relation: Model.AnyRelation & Model.InversedRelation
}

export interface RemoveFieldModification {
	modification: 'removeField'
	entityName: string
	fieldName: string
}

export interface UpdateFieldNameModification {
	modification: 'updateFieldName'
	entityName: string
	fieldName: string
	newFieldName: string
}

export interface UpdateColumnNameModification {
	modification: 'updateColumnName'
	entityName: string
	fieldName: string
	columnName: string
}

export interface UpdateColumnDefinitionModification {
	modification: 'updateColumnDefinition'
	entityName: string
	fieldName: string
	definition: Model.AnyColumnDefinition
}

export interface CreateUniqueConstraintModification {
	modification: 'createUniqueConstraint'
	entityName: string
	unique: Model.UniqueConstraint
}

export interface RemoveUniqueConstraintModification {
	modification: 'removeUniqueConstraint'
	entityName: string
	constraintName: string
}

export interface CreateEnumModification {
	modification: 'createEnum'
	enumName: string
	values: string[]
}

export interface RemoveEnumModification {
	modification: 'removeEnum'
	enumName: string
}

export interface UpdateEnumModification {
	modification: 'updateEnum'
	enumName: string
	values: string[]
}

export type Modification =
	| CreateEntityModification
	| RemoveEntityModification
	| UpdateEntityNameModification
	| UpdateEntityTableNameModification
	| CreateColumnModification
	| CreateRelationModification
	| CreateRelationInverseSideModification
	| RemoveFieldModification
	| UpdateFieldNameModification
	| UpdateColumnNameModification
	| UpdateColumnDefinitionModification
	| CreateUniqueConstraintModification
	| RemoveUniqueConstraintModification
	| CreateEnumModification
	| RemoveEnumModification
	| UpdateEnumModification

export interface SchemaDiff {
	modifications: Modification[]
}
