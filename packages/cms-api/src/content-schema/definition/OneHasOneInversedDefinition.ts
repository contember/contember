import FieldDefinition from './FieldDefinition'
import { RelationTarget } from './types'
import { Interface } from '../../utils/interfaceType'
import { Model } from 'cms-common'

class OneHasOneInversedDefinition extends FieldDefinition<OneHasOneInversedDefinition.Options> {
	type = 'OneHasOneInversedDefinition' as const

	notNull(): Interface<OneHasOneInversedDefinition> {
		return this.withOption('nullable', false)
	}

	createField({ name, conventions, entityRegistry }: FieldDefinition.CreateFieldContext): Model.AnyField {
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

namespace OneHasOneInversedDefinition {
	export type Options = {
		target: RelationTarget
		ownedBy: string
		nullable?: boolean
	}
}

export default OneHasOneInversedDefinition
