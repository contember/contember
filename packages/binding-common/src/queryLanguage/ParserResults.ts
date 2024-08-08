import {
	EntityName,
	FieldName,
	Filter,
	UniqueWhere,
} from '../treeParameters'

export interface ParsedQualifiedSingleEntity {
	where: UniqueWhere
	filter: Filter | undefined
	entityName: EntityName
	hasOneRelationPath: ParsedHasOneRelation[]
}

export interface ParsedRelativeSingleEntity {
	hasOneRelationPath: ParsedHasOneRelation[]
}

export interface ParsedUnconstrainedQualifiedSingleEntity {
	entityName: EntityName
	hasOneRelationPath: ParsedHasOneRelation[]
}

export interface ParsedQualifiedEntityList {
	entityName: EntityName
	hasOneRelationPath: ParsedHasOneRelation[]
	filter: Filter | undefined
}

export interface ParsedRelativeEntityList {
	hasOneRelationPath: ParsedHasOneRelation[]
	hasManyRelation: ParsedHasManyRelation
}

export interface ParsedUnconstrainedQualifiedEntityList {
	entityName: EntityName
	hasOneRelationPath: ParsedHasOneRelation[]
}

export interface ParsedQualifiedFieldList {
	field: FieldName
	entityName: EntityName
	filter: Filter | undefined
	hasOneRelationPath: ParsedHasOneRelation[]
}

export interface ParsedRelativeSingleField {
	hasOneRelationPath: ParsedHasOneRelation[]
	field: FieldName
}

export interface ParsedHasManyRelation {
	field: FieldName
	filter: Filter | undefined
}

export interface ParsedHasOneRelation {
	filter: Filter | undefined
	field: FieldName
	reducedBy: UniqueWhere | undefined
}

export interface ParsedTaggedMap {
	name: string
	entries: ParsedTaggedMapEntry[]
}

export interface ParsedTaggedMapEntry {
	key: string
	value: ParsedTaggedMapLiteralValue | ParsedTaggedMapVariableValue
}

export interface ParsedTaggedMapLiteralValue {
	type: 'literal'
	value:  string | number
}

export interface ParsedTaggedMapVariableValue {
	type: 'variable'
	value: string
}
