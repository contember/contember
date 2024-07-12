import type { EntityName, FieldName, Filter, UniqueWhere } from '../../treeParameters'

export class TreeParameterSugarer {
	public static sugarField(fieldName: FieldName) {
		return fieldName
	}

	public static sugarHasOneRelation(
		fieldName: FieldName,
		reducedBy: UniqueWhere | undefined,
		filter: Filter | undefined,
	) {
		return `${fieldName}${this.sugarUniqueWhere(reducedBy)}${this.sugarFilter(filter)}`
	}

	public static sugarHasManyRelation(fieldName: FieldName, filter: Filter | undefined) {
		return `${fieldName}${this.sugarFilter(filter)}`
	}

	public static sugarRootEntity(entityName: EntityName, where: UniqueWhere | undefined) {
		return `${entityName}${this.sugarUniqueWhere(where)}`
	}

	public static sugarRootEntityList(entityName: EntityName, filter: Filter | undefined) {
		return `${entityName}${this.sugarFilter(filter)}`
	}

	public static sugarUniqueWhere(where: UniqueWhere | undefined): string {
		if (where === undefined) {
			return ''
		}
		return `(…)` // TODO
	}

	public static sugarFilter(filter: Filter | undefined): string {
		if (filter === undefined) {
			return ''
		}
		return `[…]` // TODO
	}
}
