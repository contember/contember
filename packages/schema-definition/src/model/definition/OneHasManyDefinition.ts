import { Model } from '@contember/schema'
import FieldDefinition from './FieldDefinition'
import { RelationTarget } from './types'

class OneHasManyDefinition extends FieldDefinition<OneHasManyDefinition.Options> {
	type = 'OneHasManyDefinition' as const

	createField({ name, entityRegistry }: FieldDefinition.CreateFieldContext): Model.AnyField {
		const options = this.options
		return {
			name: name,
			ownedBy: options.ownedBy,
			type: Model.RelationType.OneHasMany,
			target: entityRegistry.getName(options.target),
		}
	}
}

namespace OneHasManyDefinition {
	export type Options = {
		target: RelationTarget
		ownedBy: string
	}
}

export default OneHasManyDefinition
