import type { EntityName, FieldName } from '../../treeParameters'
import type { SchemaRelationOrderBy } from './SchemaRelationOrderBy'

export interface BaseRelation {
	__typename: '_Relation'

	name: FieldName
	// This *CAN* be null because the whole notion of nullability doesn't make sense for ManyHasMany
	nullable: boolean | null
	onDelete: 'restrict' | 'cascade' | 'setNull' | null
	orderBy: SchemaRelationOrderBy[] | null
	orphanRemoval: boolean | null
	targetEntity: EntityName
	type: 'OneHasOne' | 'OneHasMany' | 'ManyHasOne' | 'ManyHasMany'
}

export interface OwningRelation extends BaseRelation {
	side: 'owning'
	inversedBy: FieldName | null
	ownedBy?: never
}

export interface InverseRelation extends BaseRelation {
	side: 'inverse'
	ownedBy: FieldName
	inversedBy?: never
}

export type SchemaRelation = OwningRelation | InverseRelation
