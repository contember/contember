import { Model } from '@contember/schema'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'
import { EntityConstructor, Interface, RelationTarget } from '../types'

export class OneHasManyDefinitionImpl extends FieldDefinition<OneHasManyDefinitionOptions> {
	type = 'OneHasManyDefinition' as const

	orderBy(
		field: string | string[],
		direction: Model.OrderDirection = Model.OrderDirection.asc,
	): Interface<OneHasManyDefinition> {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction }])
	}
	createField({ name, entityRegistry }: CreateFieldContext): Model.AnyField {
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

export type OneHasManyDefinition = Interface<OneHasManyDefinitionImpl>

export function oneHasMany(target: EntityConstructor, ownedBy: string): OneHasManyDefinition {
	return new OneHasManyDefinitionImpl({ target, ownedBy })
}

export type OneHasManyDefinitionOptions = {
	target: RelationTarget
	ownedBy: string
	orderBy?: Model.OrderBy[]
}
