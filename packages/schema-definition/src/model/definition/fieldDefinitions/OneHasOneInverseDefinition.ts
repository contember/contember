import { Model } from '@contember/schema'
import { EntityConstructor } from '../types.js'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition.js'
import { RelationTarget } from '../types.js'

export class OneHasOneInverseDefinition extends FieldDefinition<OneHasOneInverseDefinitionOptions> {
	type = 'OneHasOneInverseDefinition' as const

	notNull() {
		return this.withOption('nullable', false)
	}

	createField({ name, conventions, entityRegistry }: CreateFieldContext): Model.AnyField {
		const options = this.options
		return {
			name: name,
			ownedBy: options.ownedBy,
			target: entityRegistry.getName(options.target),
			type: Model.RelationType.OneHasOne,
			nullable: options.nullable === undefined ? true : options.nullable,
		}
	}

	protected withOption<K extends keyof OneHasOneInverseDefinitionOptions>(
		this: any,
		key: K,
		value: OneHasOneInverseDefinitionOptions[K],
	): OneHasOneInverseDefinition {
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
}
