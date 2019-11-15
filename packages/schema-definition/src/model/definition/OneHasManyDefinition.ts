import { Model } from '@contember/schema'
import FieldDefinition from './FieldDefinition'
import { Interface, RelationTarget } from './types'

class OneHasManyDefinition extends FieldDefinition<OneHasManyDefinition.Options> {
	type = 'OneHasManyDefinition' as const

	orderBy(
		field: string | string[],
		direction: Model.OrderDirection = Model.OrderDirection.asc,
	): Interface<OneHasManyDefinition> {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction }])
	}
	createField({ name, entityRegistry }: FieldDefinition.CreateFieldContext): Model.AnyField {
		const options = this.options
		return {
			name: name,
			ownedBy: options.ownedBy,
			type: Model.RelationType.OneHasMany,
			target: entityRegistry.getName(options.target),
			...(options.orderBy ? { orderBy: options.orderBy } : {}),
		}
	}
}

namespace OneHasManyDefinition {
	export type Options = {
		target: RelationTarget
		ownedBy: string
		orderBy?: Model.OrderBy[]
	}
}

export default OneHasManyDefinition
