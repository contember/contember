import { Model } from '@contember/schema'
import FieldDefinition from './FieldDefinition'
import { RelationTarget } from './types'

class ManyHasManyInversedDefinition extends FieldDefinition<ManyHasManyInversedDefinition.Options> {
	type = 'ManyHasManyInversedDefinition' as const

	createField({ name, conventions, entityName, entityRegistry }: FieldDefinition.CreateFieldContext): Model.AnyField {
		const options = this.options
		return {
			name: name,
			ownedBy: options.ownedBy,
			target: entityRegistry.getName(options.target),
			type: Model.RelationType.ManyHasMany,
		}
	}
}

namespace ManyHasManyInversedDefinition {
	export type Options = {
		target: RelationTarget
		ownedBy: string
	}
}

export default ManyHasManyInversedDefinition
