import { Filter, UniqueWhere } from '../../treeParameters'

export class TreeParameterSugarer {
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
