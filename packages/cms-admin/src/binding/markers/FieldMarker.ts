import { GraphQlBuilder } from '@contember/client'
import { Scalar } from '../accessorTree'
import { FieldName } from '../treeParameters'
import { PlaceholderGenerator } from './PlaceholderGenerator'

/**
 * A nonbearing field is only defined in context of create mutations. An entity will be created if and only if some
 * other fields (not just nonbearing fields) are filled as well. This is particularly useful for programmatically
 * controlled fields within repeaters.
 */
export class FieldMarker {
	constructor(
		public readonly fieldName: FieldName,
		public readonly defaultValue?: GraphQlBuilder.Literal | Scalar,
		public readonly isNonbearing: boolean = false,
	) {}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateFieldMarkerPlaceholder(this)
	}
}
