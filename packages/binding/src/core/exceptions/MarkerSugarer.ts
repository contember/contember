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
		return field.fieldName
	}

	public static sugarHasOneRelationMarker(hasOne: HasOneRelationMarker) {
		return `${hasOne.relation.field}${TreeParameterSugarer.sugarUniqueWhere(
			hasOne.relation.reducedBy,
		)}${TreeParameterSugarer.sugarFilter(hasOne.relation.filter)}`
	}

	public static sugarHasManyRelationMarker(hasMany: HasManyRelationMarker) {
		return `${hasMany.relation.field}${TreeParameterSugarer.sugarFilter(hasMany.relation.filter)}`
	}

	public static sugarSubTreeMarker(subTree: SubTreeMarker) {
		if (subTree.parameters.type === 'qualifiedEntityList') {
			return `${subTree.entityName}${subTree.parameters.value.filter}`
		}
		return subTree.entityName
	}
}
