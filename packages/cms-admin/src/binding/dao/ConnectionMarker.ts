import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { FieldName } from '../bindingTypes'
import { PlaceholderGenerator } from '../model'

export class ConnectionMarker {
	public constructor(
		public readonly fieldName: FieldName,
		public readonly target: Input.UniqueWhere<GraphQlBuilder.Literal>
	) {}

	get placeholderName(): string {
		return PlaceholderGenerator.generateConnectionMarkerPlaceholder(this)
	}
}
