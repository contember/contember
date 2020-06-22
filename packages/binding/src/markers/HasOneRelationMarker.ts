import { HasOneRelation } from '../treeParameters'
import { EntityFieldMarkers } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

// This may also represent a reduced has many relation.
export class HasOneRelationMarker {
	private _placeholderName: string | undefined

	public constructor(public readonly relation: HasOneRelation, public readonly fields: EntityFieldMarkers) {}

	public get placeholderName(): string {
		if (this._placeholderName === undefined) {
			this._placeholderName = PlaceholderGenerator.generateHasOneRelationMarkerPlaceholder(this)
		}
		return this._placeholderName
	}
}
