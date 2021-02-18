import { Environment } from '../dao'
import { QualifiedSingleEntity, UnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export class EntitySubTreeMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly parameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.getEntitySubTreePlaceholder(this.parameters)
	}

	public get entityName() {
		return this.parameters.entityName
	}
}
