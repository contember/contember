import { Environment } from '../dao'
import { HasOneRelation } from '../treeParameters'
import { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { PlaceholderGenerator } from './PlaceholderGenerator'

// This may also represent a reduced has many relation.
export class HasOneRelationMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly relation: HasOneRelation,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.generateHasOneRelationMarkerPlaceholder(this)
	}
}
