import { GraphQlBuilder } from '@contember/client'
import { Input } from '@contember/schema'
import { FieldName } from '../treeParameters'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export class ConnectionMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly fieldName: FieldName,
		public readonly target: Input.UniqueWhere<GraphQlBuilder.Literal>,
		public readonly isNonbearing: boolean | undefined = true,
	) {
		this.placeholderName = PlaceholderGenerator.generateConnectionMarkerPlaceholder(this)
	}
}
