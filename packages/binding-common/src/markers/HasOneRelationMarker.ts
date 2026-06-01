import type { Environment } from '../environment/index.js'
import type { HasOneRelation } from '../treeParameters/index.js'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer.js'
import { PlaceholderGenerator } from './PlaceholderGenerator.js'

// This may also represent a reduced has many relation.
export class HasOneRelationMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly parameters: HasOneRelation,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.getHasOneRelationPlaceholder(this.parameters)
	}

	public get isNonbearing() {
		return this.parameters.isNonbearing
	}
}
