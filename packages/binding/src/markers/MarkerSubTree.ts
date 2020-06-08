import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { EntityFieldMarkers } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export type MarkerSubTreeParameters =
	| BoxedQualifiedSingleEntity
	| BoxedQualifiedEntityList
	| BoxedUnconstrainedQualifiedSingleEntity
	| BoxedUnconstrainedQualifiedEntityList

export class MarkerSubTree<C extends MarkerSubTreeParameters = MarkerSubTreeParameters> {
	public constructor(public readonly parameters: C, public readonly fields: EntityFieldMarkers) {}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateMarkerSubTreePlaceholder(this)
	}

	public get entityName() {
		return this.parameters.value.entityName
	}
}
