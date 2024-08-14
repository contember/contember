import type { FieldName, FieldValue, RelativeSingleField } from '../treeParameters'
import { PlaceholderGenerator } from './PlaceholderGenerator'

/**
 * A nonbearing field is only defined in context of create mutations. An entity will be created if and only if some
 * other fields (not just nonbearing fields) are filled as well. This is particularly useful for programmatically
 * controlled fields within repeaters.
 */
export class FieldMarker {
	public readonly placeholderName: string

	constructor(
		public readonly parameters: Omit<RelativeSingleField, 'hasOneRelationPath'>,
	) {
		this.placeholderName = PlaceholderGenerator.getFieldPlaceholder(this.parameters.field)
	}

	get fieldName(): FieldName {
		return this.parameters.field
	}

	get isNonbearing(): boolean {
		return this.parameters.isNonbearing
	}

	get defaultValue(): FieldValue | undefined {
		return this.parameters.defaultValue
	}
}
