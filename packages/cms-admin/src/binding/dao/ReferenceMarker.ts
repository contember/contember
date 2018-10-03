import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { FieldName } from '../bindingTypes'
import EntityFields from './EntityFields'

export enum ExpectedCount {
	One, Many
}

export default class ReferenceMarker {
	constructor(
		public readonly fieldName: FieldName,
		public readonly expectedCount: ExpectedCount,
		public readonly fields: EntityFields,
		public readonly where?: Input.Where<GraphQlBuilder.Literal>,
	) {}
}
