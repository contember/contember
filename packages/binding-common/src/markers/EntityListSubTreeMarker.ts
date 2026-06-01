import type { Environment } from '../environment/index.js'
import type { QualifiedEntityList, UnconstrainedQualifiedEntityList } from '../treeParameters/index.js'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer.js'
import { PlaceholderGenerator } from './PlaceholderGenerator.js'

export class EntityListSubTreeMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly parameters: QualifiedEntityList | UnconstrainedQualifiedEntityList,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.getEntityListSubTreePlaceholder(this.parameters, this.environment)
	}

	public get entityName() {
		return this.parameters.entityName
	}
}
