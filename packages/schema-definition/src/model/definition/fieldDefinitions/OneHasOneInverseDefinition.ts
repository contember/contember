import { Model } from '@contember/schema'
import { EntityConstructor } from '../types'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition'
import { RelationTarget } from '../types'

export class OneHasOneInverseDefinition extends FieldDefinition<OneHasOneInverseDefinitionOptions> {
	type = 'OneHasOneInverseDefinition' as const

	public notNull() {
		return this.withOption('nullable', false)
	}

	public deprecated(deprecationReason?: string): OneHasOneInverseDefinition {
		return this.withOption('deprecationReason', deprecationReason || 'This field is deprecated')
	}

	public alias(...aliases: string[]): OneHasOneInverseDefinition {
		return this.withOption('aliases', aliases)
	}

	public createField({ name, conventions, entityRegistry }: CreateFieldContext): Model.AnyField {
		const options = this.options
		return {
			name: name,
			ownedBy: options.ownedBy,
			target: entityRegistry.getName(options.target),
			type: Model.RelationType.OneHasOne,
			nullable: options.nullable === undefined ? true : options.nullable,
			...(options.aliases !== undefined ? { aliases: options.aliases } : {}),
			...(options.deprecationReason !== undefined ? { deprecationReason: options.deprecationReason } : {}),
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
	aliases?: string[]
	deprecationReason?: string
}
