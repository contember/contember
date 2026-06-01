import type { Environment } from '../environment/index.js'
import type { QualifiedSingleEntity, UnconstrainedQualifiedSingleEntity } from '../treeParameters/index.js'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer.js'
import { PlaceholderGenerator } from './PlaceholderGenerator.js'

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
