import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { FieldName } from '../bindingTypes'
import { Hashing } from '../utils'
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
			this._placeholderName = this.hash()
		}
		return this._placeholderName
	}

	private hash(): string {
		return this.where ? `${this.fieldName}_${Hashing.hashWhere(this.where)}` : this.fieldName
	}
}

namespace ReferenceMarker {
	export enum ExpectedCount {
		One, Many
	}
}

export default ReferenceMarker
