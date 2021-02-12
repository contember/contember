import { Environment } from '../dao'
import { QualifiedEntityList, UnconstrainedQualifiedEntityList } from '../treeParameters'
import { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export class EntityListSubTreeMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly parameters: QualifiedEntityList | UnconstrainedQualifiedEntityList,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.getEntityListSubTreePlaceholder(this.parameters)
	}

	public get entityName() {
		return this.parameters.entityName
	}
}
