import type { Environment } from '../dao'
import type { QualifiedSingleEntity, UnconstrainedQualifiedSingleEntity } from '../treeParameters'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export class EntitySubTreeMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly parameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.getEntitySubTreePlaceholder(this.parameters, this.environment)
	}

	public get entityName() {
		return this.parameters.entityName
	}
}
