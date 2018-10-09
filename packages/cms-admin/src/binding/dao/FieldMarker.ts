import { FieldName } from '../bindingTypes'
import PlaceholderGenerator from '../model/PlaceholderGenerator'

export default class FieldMarker {
	constructor(public readonly fieldName: FieldName) {}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateFieldMarkerPlaceholder(this)
	}
}
