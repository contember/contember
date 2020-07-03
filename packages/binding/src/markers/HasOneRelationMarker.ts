import { Environment } from '../dao'
import { HasOneRelation } from '../treeParameters'
import { EntityFieldMarkers, hasAtLeastOneBearingField } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

// This may also represent a reduced has many relation.
export class HasOneRelationMarker {
	public readonly placeholderName: string
	public readonly hasAtLeastOneBearingField: boolean

	public constructor(
		public readonly relation: HasOneRelation,
		public readonly fields: EntityFieldMarkers,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.generateHasOneRelationMarkerPlaceholder(this)
		this.hasAtLeastOneBearingField = hasAtLeastOneBearingField(fields)
	}
}
