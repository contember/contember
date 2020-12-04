import { Model } from '@contember/schema'
import FieldDefinition from './FieldDefinition'
import { Interface, RelationTarget } from './types'

class ManyHasManyInverseDefinition extends FieldDefinition<ManyHasManyInverseDefinition.Options> {
	type = 'ManyHasManyInverseDefinition' as const

	orderBy(
		field: string | string[],
		direction: Model.OrderDirection = Model.OrderDirection.asc,
	): Interface<ManyHasManyInverseDefinition> {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction }])
	}

	createField({ name, conventions, entityName, entityRegistry }: FieldDefinition.CreateFieldContext): Model.AnyField {
		const options = this.options
		return {
			name: name,
			ownedBy: options.ownedBy,
			target: entityRegistry.getName(options.target),
			type: Model.RelationType.ManyHasMany,
			...(options.orderBy ? { orderBy: options.orderBy } : {}),
		}
	}
}

namespace ManyHasManyInverseDefinition {
	export type Options = {
		target: RelationTarget
		ownedBy: string
		orderBy?: Model.OrderBy[]
	}
}

export default ManyHasManyInverseDefinition
