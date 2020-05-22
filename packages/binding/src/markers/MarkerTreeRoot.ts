import {
	QualifiedEntityList,
	QualifiedSingleEntity,
	UnconstrainedQualifiedEntityList,
	UnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { EntityFieldMarkers } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export interface TaggedQualifiedSingleEntity extends QualifiedSingleEntity {
	type: 'unique'
}

export interface TaggedQualifiedEntityList extends QualifiedEntityList {
	type: 'nonUnique'
}

export interface TaggedUnconstrainedQualifiedSingleEntity extends UnconstrainedQualifiedSingleEntity {
	type: 'unconstrainedUnique'
}

export interface TaggedUnconstrainedQualifiedEntityList extends UnconstrainedQualifiedEntityList {
	type: 'unconstrainedNonUnique'
}

export type MarkerTreeParameters =
	| TaggedQualifiedSingleEntity
	| TaggedQualifiedEntityList
	| TaggedUnconstrainedQualifiedSingleEntity
	| TaggedUnconstrainedQualifiedEntityList

export class MarkerTreeRoot<C extends MarkerTreeParameters = MarkerTreeParameters> {
	public constructor(public readonly parameters: C, public readonly fields: EntityFieldMarkers) {}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateMarkerTreeRootPlaceholder(this)
	}

	public get entityName() {
		return this.parameters.entityName
	}
}
