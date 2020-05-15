import {
	QualifiedEntityList,
	QualifiedSingleEntity,
	SubTreeIdentifier,
	UnconstrainedQualifiedEntityList,
} from '../treeParameters'
import { EntityFieldMarkers } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export interface TaggedQualifiedSingleEntity extends QualifiedSingleEntity {
	type: 'unique'
}

export interface TaggedQualifiedEntityList extends QualifiedEntityList {
	type: 'nonUnique'
}

export interface TaggedUnconstrainedQualifiedEntityList extends UnconstrainedQualifiedEntityList {
	type: 'unconstrained'
}

export type MarkerTreeParameters =
	| TaggedQualifiedSingleEntity
	| TaggedQualifiedEntityList
	| TaggedUnconstrainedQualifiedEntityList

class MarkerTreeRoot<C extends MarkerTreeParameters = MarkerTreeParameters> {
	public readonly id: MarkerTreeRoot.TreeId

	public constructor(
		idSeed: number,
		public readonly parameters: C,
		public readonly fields: EntityFieldMarkers,
		public readonly subTreeIdentifier?: SubTreeIdentifier,
	) {
		this.id = `treeRoot${idSeed.toFixed(0)}`
	}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateMarkerTreeRootPlaceholder(this)
	}

	public get entityName() {
		return this.parameters.entityName
	}
}

namespace MarkerTreeRoot {
	export type TreeId = string
}

export { MarkerTreeRoot }
