import { ReactNode, useCallback } from 'react'
import { dict } from '../dict'
import { ErrorAccessor } from '@contember/interface'

/**
 * `useErrorFormatter` is a custom hook that formats an array of errors into readable messages.
 * It processes validation and execution errors and returns corresponding user-friendly messages.
 *
 * #### Returns
 * A memoized callback function that takes an array of `ErrorAccessor.Error` and returns an array of `ReactNode` messages.
 *
 * #### Example: Formatting validation and execution errors
 * ```tsx
 * const formatErrors = useErrorFormatter();
 *
 * const errors = [
 *   { type: 'validation', code: 'fieldRequired', message: 'This field is required' },
 *   { type: 'execution', code: 'UniqueConstraintViolation' }
 * ];
 *
 * const formattedErrors = formatErrors(errors);
 *
 * return <>{formattedErrors.map((error, i) => <div key={i}>{error}</div>)}</>;
 * ```
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
