import { Model } from '@contember/schema'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'
import { EntityConstructor, RelationTarget } from '../types'

export class ManyHasManyInverseDefinition extends FieldDefinition<ManyHasManyInverseDefinitionOptions> {
	type = 'ManyHasManyInverseDefinition' as const

	orderBy(
		field: string | string[],
		direction: Model.OrderDirection | `${Model.OrderDirection}` = Model.OrderDirection.asc,
	): ManyHasManyInverseDefinition {
		const path = typeof field === 'string' ? [field] : field
		return this.withOption('orderBy', [...(this.options.orderBy || []), { path, direction: direction as Model.OrderDirection }])
	}

	public deprecated(deprecationReason?: string): ManyHasManyInverseDefinition {
		return this.withOption('deprecationReason', deprecationReason || 'This field is deprecated')
	}

	public alias(...aliases: string[]): ManyHasManyInverseDefinition {
		return this.withOption('aliases', aliases)
	}

	public createField({ name, conventions, entityName, entityRegistry }: CreateFieldContext): Model.AnyField {
		const options = this.options
		return {
			name: name,
			ownedBy: options.ownedBy,
			target: entityRegistry.getName(options.target),
			type: Model.RelationType.ManyHasMany,
			...(options.orderBy ? { orderBy: options.orderBy } : {}),
			...(options.aliases !== undefined ? { aliases: options.aliases } : {}),
			...(options.deprecationReason !== undefined ? { deprecationReason: options.deprecationReason } : {}),
		}
	}

	protected withOption<K extends keyof ManyHasManyInverseDefinitionOptions>(key: K, value: ManyHasManyInverseDefinitionOptions[K]): ManyHasManyInverseDefinition {
		return new ManyHasManyInverseDefinition({ ...this.options, [key]: value })
	}
}


export function manyHasManyInverse(target: EntityConstructor, ownedBy: string): ManyHasManyInverseDefinition {
	return new ManyHasManyInverseDefinition({ target, ownedBy })
}

export type ManyHasManyInverseDefinitionOptions = {
	target: RelationTarget
	ownedBy: string
	orderBy?: Model.OrderBy[]
	aliases?: string[]
	deprecationReason?: string
}
