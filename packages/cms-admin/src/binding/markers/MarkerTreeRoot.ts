import {
	EntityListTreeConstraints,
	EntityTreeSpecification,
	SingleEntityTreeConstraints,
	SubTreeIdentifier,
} from '../treeParameters'
import { EntityFields } from './EntityFields'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export interface TaggedSingleEntityTreeConstraints extends SingleEntityTreeConstraints {
	type: 'unique'
}

export interface TaggedEntityListTreeConstraints extends EntityListTreeConstraints {
	type: 'nonUnique'
}

export interface TaggedUnconstrainedEntityList extends EntityTreeSpecification {
	type: 'unconstrained'
}

export type MarkerTreeConstraints =
	| TaggedSingleEntityTreeConstraints
	| TaggedEntityListTreeConstraints
	| TaggedUnconstrainedEntityList

class MarkerTreeRoot<C extends MarkerTreeConstraints = MarkerTreeConstraints> {
	public readonly id: MarkerTreeRoot.TreeId

	public constructor(
		idSeed: number,
		public readonly constraints: C,
		public readonly fields: EntityFields,
		public readonly subTreeIdentifier?: SubTreeIdentifier,
	) {
		this.id = `treeRoot${idSeed.toFixed(0)}`
	}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateMarkerTreeRootPlaceholder(this)
	}

	public get entityName() {
		return this.constraints.entityName
	}
}

namespace MarkerTreeRoot {
	export type TreeId = string
}

export { MarkerTreeRoot }
