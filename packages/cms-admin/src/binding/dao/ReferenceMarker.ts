import { FieldName } from '../bindingTypes'
import EntityMarker from './EntityMarker'

export enum ExpectedCount {
	One, Many
}

export default class ReferenceMarker {
	constructor(
		public readonly fieldName: FieldName,
		public readonly expectedCount: ExpectedCount,
		public readonly reference: EntityMarker,
	) {}
}
