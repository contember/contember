import { FieldMarker, HasManyRelationMarker, HasOneRelationMarker, Marker, SubTreeMarker } from '../../markers'
import { assertNever } from '../../utils'
import { TreeParameterSugarer } from './TreeParameterSugarer'

export class MarkerSugarer {
	public static sugarMarker(marker: Marker): string {
		if (marker instanceof FieldMarker) {
			return this.sugarFieldMarker(marker)
		}
		if (marker instanceof HasOneRelationMarker) {
			return this.sugarHasOneRelationMarker(marker)
		}
		if (marker instanceof HasManyRelationMarker) {
			return this.sugarHasManyRelationMarker(marker)
		}
		if (marker instanceof SubTreeMarker) {
			return this.sugarSubTreeMarker(marker)
		}
		return assertNever(marker)
	}

	public static sugarFieldMarker(field: FieldMarker) {
		return TreeParameterSugarer.sugarField(field.fieldName)
	}

	public static sugarHasOneRelationMarker(hasOne: HasOneRelationMarker) {
		return TreeParameterSugarer.sugarHasOneRelation(
			hasOne.relation.field,
			hasOne.relation.reducedBy,
			hasOne.relation.filter,
		)
	}

	public static sugarHasManyRelationMarker(hasMany: HasManyRelationMarker) {
		return TreeParameterSugarer.sugarHasManyRelation(hasMany.relation.field, hasMany.relation.filter)
	}

	public static sugarSubTreeMarker(subTree: SubTreeMarker) {
		if (subTree.parameters.type === 'qualifiedEntityList') {
			return TreeParameterSugarer.sugarRootEntityList(subTree.entityName, subTree.parameters.value.filter)
		}
		if (subTree.parameters.isConstrained) {
			return TreeParameterSugarer.sugarRootEntity(subTree.entityName, subTree.parameters.value.where)
		}
		return TreeParameterSugarer.sugarRootEntity(subTree.entityName, undefined)
	}
}
