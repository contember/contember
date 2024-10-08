import { Model } from '@contember/schema'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'
import { EntityConstructor, RelationTarget } from '../types'

export class OneHasManyDefinition extends FieldDefinition<OneHasManyDefinitionOptions> {
	type = 'OneHasManyDefinition' as const

	orderBy(
		field: string | string[],
		direction: Model.OrderDirection | `${Model.OrderDirection}` = Model.OrderDirection.asc,
	): OneHasManyDefinition {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction: direction as Model.OrderDirection }])
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

	protected withOption<K extends keyof OneHasManyDefinitionOptions>(key: K, value: OneHasManyDefinitionOptions[K]): OneHasManyDefinition {
		return new OneHasManyDefinition({ ...this.options, [key]: value })
	}
}


export function oneHasMany(target: EntityConstructor, ownedBy: string): OneHasManyDefinition {
	return new OneHasManyDefinition({ target, ownedBy })
}

export type OneHasManyDefinitionOptions = {
	target: RelationTarget
	ownedBy: string
	orderBy?: Model.OrderBy[]
}
