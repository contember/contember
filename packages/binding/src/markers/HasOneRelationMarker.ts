import { TreeParameterMerger } from '../model'
import { HasOneRelation } from '../treeParameters'
import { EntityFieldMarkers, hasAtLeastOneBearingField } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

// This may also represent a reduced has many relation.
export class HasOneRelationMarker {
	public readonly placeholderName: string
	public readonly hasAtLeastOneBearingField: boolean
	public readonly relation: HasOneRelation

	public constructor(relation: HasOneRelation, public readonly fields: EntityFieldMarkers) {
		this.relation = {
			...relation,
			setOnCreate: relation.reducedBy
				? TreeParameterMerger.mergeSetOnCreate(relation.setOnCreate || {}, relation.reducedBy)
				: undefined,
		}
		this.placeholderName = PlaceholderGenerator.generateHasOneRelationMarkerPlaceholder(this)
		this.hasAtLeastOneBearingField = hasAtLeastOneBearingField(fields)
	}
}
