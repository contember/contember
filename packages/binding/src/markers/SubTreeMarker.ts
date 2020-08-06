import { Environment } from '../dao'
import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export type SubTreeMarkerParameters =
	| BoxedQualifiedSingleEntity
	| BoxedQualifiedEntityList
	| BoxedUnconstrainedQualifiedSingleEntity
	| BoxedUnconstrainedQualifiedEntityList

export class SubTreeMarker<Parameters extends SubTreeMarkerParameters = SubTreeMarkerParameters> {
	public readonly placeholderName: string

	public constructor(
		public readonly parameters: Parameters,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		this.placeholderName = PlaceholderGenerator.generateSubTreeMarkerPlaceholder(this)
	}

	public get entityName() {
		return this.parameters.value.entityName
	}
}
