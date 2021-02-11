import { EntityName, FieldName } from '../../treeParameters'
import { SchemaRelationOrderBy } from './SchemaRelationOrderBy'

export interface SchemaRelation {
	__typename: '_Relation'

	inversedBy: FieldName | null
	name: FieldName
	// This *CAN* be null because the whole notion of nullability doesn't make sense for ManyHasMany
	nullable: boolean | null
	onDelete: 'restrict' | 'cascade' | 'setNull' | null
	orderBy: SchemaRelationOrderBy | null
	orphanRemoval: boolean | null
	ownedBy: FieldName | null
	side: 'owning' | 'inverse'
	targetEntity: EntityName
	type: 'OneHasOne' | 'OneHasMany' | 'ManyHasOne' | 'ManyHasMany'
}
