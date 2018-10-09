import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { FieldName } from '../bindingTypes'
import PlaceholderGenerator from '../model/PlaceholderGenerator'
import EntityFields from './EntityFields'

class ReferenceMarker {

	private _placeholderName?: string

	constructor(
		public readonly fieldName: FieldName,
		public readonly expectedCount: ReferenceMarker.ExpectedCount,
		public readonly fields: EntityFields,
		public readonly where?: Input.Where<GraphQlBuilder.Literal>,
	) {}

	public get placeholderName(): string {
		if (!this._placeholderName) {
			this._placeholderName = PlaceholderGenerator.generateReferenceMarkerPlaceholder(this)
		}
		return this._placeholderName
	}
}

namespace ReferenceMarker {
	export enum ExpectedCount {
		One, Many
	}
}

export default ReferenceMarker
