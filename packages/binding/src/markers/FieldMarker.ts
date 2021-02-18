import { GraphQlBuilder } from '@contember/client'
import { FieldName, Scalar } from '../treeParameters'
import { PlaceholderGenerator } from './PlaceholderGenerator'

/**
 * A nonbearing field is only defined in context of create mutations. An entity will be created if and only if some
 * other fields (not just nonbearing fields) are filled as well. This is particularly useful for programmatically
 * controlled fields within repeaters.
 */
export class FieldMarker {
	public readonly placeholderName: string

	constructor(
		public readonly fieldName: FieldName,
		public readonly defaultValue?: GraphQlBuilder.Literal | Scalar,
		public readonly isNonbearing: boolean = false,
	) {
		this.placeholderName = PlaceholderGenerator.getFieldPlaceholder(this.fieldName)
	}
}
