import { BindingError } from '../BindingError.js'
import type { Environment } from '../environment/index.js'
import type { HasManyRelation } from '../treeParameters/index.js'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer.js'
import { PlaceholderGenerator } from './PlaceholderGenerator.js'

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
