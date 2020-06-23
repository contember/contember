import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { EntityFieldMarkers, hasAtLeastOneBearingField } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export type SubTreeMarkerParameters =
	| BoxedQualifiedSingleEntity
	| BoxedQualifiedEntityList
	| BoxedUnconstrainedQualifiedSingleEntity
	| BoxedUnconstrainedQualifiedEntityList

export class SubTreeMarker<Parameters extends SubTreeMarkerParameters = SubTreeMarkerParameters> {
	public readonly placeholderName: string
	public readonly hasAtLeastOneBearingField: boolean

	public constructor(public readonly parameters: Parameters, public readonly fields: EntityFieldMarkers) {
		this.placeholderName = PlaceholderGenerator.generateSubTreeMarkerPlaceholder(this)
		this.hasAtLeastOneBearingField = hasAtLeastOneBearingField(fields)
	}

	public get entityName() {
		return this.parameters.value.entityName
	}
}
