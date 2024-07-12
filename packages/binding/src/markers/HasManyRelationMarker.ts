import { BindingError } from '../BindingError'
import type { Environment } from '../dao'
import type { HasManyRelation } from '../treeParameters'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { PlaceholderGenerator } from './PlaceholderGenerator'

// This doesn't represent reduced has many relations.
export class HasManyRelationMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly parameters: HasManyRelation,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		if (import.meta.env.DEV) {
			if (parameters.initialEntityCount < 0 || !Number.isInteger(parameters.initialEntityCount)) {
				throw new BindingError(`The preferred 'initialEntityCount' for a relation must be a non-negative integer!`)
			}
		}
		this.placeholderName = PlaceholderGenerator.getHasManyRelationPlaceholder(this.parameters)
	}

	public get isNonbearing() {
		return this.parameters.isNonbearing
	}
}
