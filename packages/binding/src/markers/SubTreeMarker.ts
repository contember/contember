import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { EntityFieldMarkers } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export type SubTreeMarkerParameters =
	| BoxedQualifiedSingleEntity
	| BoxedQualifiedEntityList
	| BoxedUnconstrainedQualifiedSingleEntity
	| BoxedUnconstrainedQualifiedEntityList

export class SubTreeMarker<Parameters extends SubTreeMarkerParameters = SubTreeMarkerParameters> {
	private _placeholderName: string | undefined

	public constructor(public readonly parameters: Parameters, public readonly fields: EntityFieldMarkers) {}

	public get entityName() {
		return this.parameters.value.entityName
	}

	public get placeholderName(): string {
		if (this._placeholderName === undefined) {
			this._placeholderName = PlaceholderGenerator.generateSubTreeMarkerPlaceholder(this)
		}
		return this._placeholderName
	}
}
