import { ReactNode, useCallback } from 'react'
import { dict } from '../dict'
import { ErrorAccessor } from '@contember/interface'

/**
 * useErrorFormatter hook - Transforms error objects into user-friendly messages
 *
 * #### Purpose
 * Converts Contember error objects into readable React elements for display in forms
 *
 * #### Features
 * - Handles both validation and execution errors
 * - Maps error codes to predefined dictionary messages
 * - Returns React nodes for seamless UI integration
 * - Special handling for UniqueConstraintViolation errors
 *
 * #### Return Value
 * Returns a function that accepts `ErrorAccessor.Error[]` and returns `ReactNode[]`
 *
 * #### Error Handling
 * - **Validation Errors**: Displays the original message by default
 * - **UniqueConstraintViolation**: Shows dictionary.unique error message
 * - **Other Execution Errors**: Falls back to dictionary.unknown
 *
 * #### Example
 * ```tsx
 * const formatError = useErrorFormatter()
 * const errorList = formatError(errors)
 *
 * return (
 *   <ul>
 *     {errors.map((it, i) => <li key={i}>{it}</li>)}
 *   </ul>
 * )
 * ```
 *
 * #### Implementation Notes
 * - Uses the application's dictionary for translations
 * - Memoized with useCallback for performance
 * - Extendable through the dict.errors configuration
 */
export const useErrorFormatter = () => {
	return useCallback((errors: ErrorAccessor.Error[]): ReactNode[] => {
		return errors.map((it, i) => {
			if (it.type === 'validation') {
				switch (it.code) {
					// case 'fieldRequired':
					// return  'This field is required'
					default:
						return it.message
				}
			} else if (it.type === 'execution') {
				if (it.code === 'UniqueConstraintViolation') {
					return dict.errors.unique
				} else {
					return dict.errors.unknown
				}
			} else {
				return dict.errors.unknown
			}
		})
	}, [])
}
