import { FieldName } from '../bindingTypes'
import { PlaceholderGenerator } from '../model'

export class FieldMarker {
	constructor(public readonly fieldName: FieldName) {}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateFieldMarkerPlaceholder(this)
	}
}
