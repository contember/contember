import { Model } from '@contember/schema'
import { EntityConstructor, RelationTarget } from '../types'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'
import { DEFAULT_FIELD_DEPRECATION_REASON } from '@contember/schema-utils'

export class OneHasOneInverseDefinition extends FieldDefinition<OneHasOneInverseDefinitionOptions> {
	type = 'OneHasOneInverseDefinition' as const

	public notNull() {
		return this.withOption('nullable', false)
	}

	public deprecated(deprecationReason?: string): OneHasOneInverseDefinition {
		return this.withOption('deprecationReason', deprecationReason || DEFAULT_FIELD_DEPRECATION_REASON)
	}


	public description(description: string): OneHasOneInverseDefinition {
		return this.withOption('description', description)
	}

	public createField({ name, conventions, entityRegistry }: CreateFieldContext): Model.AnyField {
		const options = this.options
		return {
			name: name,
			ownedBy: options.ownedBy,
			target: entityRegistry.getName(options.target),
			type: Model.RelationType.OneHasOne,
			nullable: options.nullable === undefined ? true : options.nullable,
			...(options.deprecationReason !== undefined ? { deprecationReason: options.deprecationReason } : {}),
			...(options.description !== undefined ? { description: options.description } : {}),
		}
	}

	protected withOption<K extends keyof OneHasOneInverseDefinitionOptions>(this: any, key: K, value: OneHasOneInverseDefinitionOptions[K]): OneHasOneInverseDefinition {
		return new this.constructor({ ...this.options, [key]: value })
	}
}


export function oneHasOneInverse(target: EntityConstructor, ownedBy: string): OneHasOneInverseDefinition {
	return new OneHasOneInverseDefinition({ target, ownedBy })
}


export type OneHasOneInverseDefinitionOptions = {
	target: RelationTarget
	ownedBy: string
	nullable?: boolean
	deprecationReason?: string
	description?: string
}
