import { GraphQlBuilder } from 'cms-client'
import { Input } from '@contember/schema'
import { FieldName } from '../bindingTypes'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export class ConnectionMarker {
	public constructor(
		public readonly fieldName: FieldName,
		public readonly target: Input.UniqueWhere<GraphQlBuilder.Literal>,
		public readonly isNonbearing: boolean = true,
	) {}

	get placeholderName(): string {
		return PlaceholderGenerator.generateConnectionMarkerPlaceholder(this)
	}
}
