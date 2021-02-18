import {
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	Marker,
} from '../../markers'
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
		if (marker instanceof EntityListSubTreeMarker) {
			return this.sugarEntityListSubTreeMarker(marker)
		}
		if (marker instanceof EntitySubTreeMarker) {
			return this.sugarEntitySubTreeMarker(marker)
		}
		return assertNever(marker)
	}

	public static sugarFieldMarker(field: FieldMarker) {
		return TreeParameterSugarer.sugarField(field.fieldName)
	}

	public static sugarHasOneRelationMarker(hasOne: HasOneRelationMarker) {
		return TreeParameterSugarer.sugarHasOneRelation(
			hasOne.parameters.field,
			hasOne.parameters.reducedBy,
			hasOne.parameters.filter,
		)
	}

	public static sugarHasManyRelationMarker(hasMany: HasManyRelationMarker) {
		return TreeParameterSugarer.sugarHasManyRelation(hasMany.parameters.field, hasMany.parameters.filter)
	}

	public static sugarEntitySubTreeMarker(subTree: EntitySubTreeMarker) {
		if (subTree.parameters.isCreating) {
			return TreeParameterSugarer.sugarRootEntity(subTree.entityName, undefined)
		}
		return TreeParameterSugarer.sugarRootEntity(subTree.entityName, subTree.parameters.where)
	}

	public static sugarEntityListSubTreeMarker(subTree: EntityListSubTreeMarker) {
		if (subTree.parameters.isCreating) {
			return TreeParameterSugarer.sugarRootEntityList(subTree.entityName, undefined)
		}
		return TreeParameterSugarer.sugarRootEntityList(subTree.entityName, subTree.parameters.filter)
	}
}
