import { Model } from '@contember/schema'
import { EntityConstructor, Interface, RelationTarget } from '../types.js'
import { CreateFieldContext, FieldDefinition } from './FieldDefinition.js'

export class OneHasOneInverseDefinitionImpl extends FieldDefinition<OneHasOneInverseDefinitionOptions> {
	type = 'OneHasOneInverseDefinition' as const

	notNull(): Interface<OneHasOneInverseDefinition> {
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
}

export type OneHasOneInverseDefinition = Interface<OneHasOneInverseDefinitionImpl>
/** @deprecated use OneHasOneInverseDefinition */
export type OneHasOneInversedDefinition = Interface<OneHasOneInverseDefinitionImpl>

export function oneHasOneInverse(target: EntityConstructor, ownedBy: string): OneHasOneInverseDefinition {
	return new OneHasOneInverseDefinitionImpl({ target, ownedBy })
}

/** @deprecated use oneHasOneInverse */
export function oneHasOneInversed(target: EntityConstructor, ownedBy: string): OneHasOneInverseDefinition {
	return new OneHasOneInverseDefinitionImpl({ target, ownedBy })
}

export type OneHasOneInverseDefinitionOptions = {
	target: RelationTarget
	ownedBy: string
	nullable?: boolean
}
