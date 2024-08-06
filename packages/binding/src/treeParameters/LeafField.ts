import type { FieldEventListeners } from './FieldEventListeners'
import type { FieldValue } from './primitives'

// These are specific to leaf fields. Common but required parameters are in AnyField.

export const LeafFieldDefaults = {
	isNonbearing: false,
} as const

export interface LeafField extends FieldEventListeners {
	isNonbearing: boolean
	defaultValue: FieldValue | undefined
}
