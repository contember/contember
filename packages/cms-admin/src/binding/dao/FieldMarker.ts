import { GraphQlBuilder } from 'cms-client'
import { FieldName, Scalar, VariableInput } from '../bindingTypes'
import { PlaceholderGenerator } from '../model'

export class FieldMarker {
	constructor(public readonly fieldName: FieldName, public readonly defaultValue?: GraphQlBuilder.Literal | Scalar) {}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateFieldMarkerPlaceholder(this)
	}
}
