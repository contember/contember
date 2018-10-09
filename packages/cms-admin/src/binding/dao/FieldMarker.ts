import { FieldName } from '../bindingTypes'

export default class FieldMarker {
	constructor(public readonly fieldName: FieldName) {}

	public get placeholderName(): string {
		return this.fieldName
	}
}
