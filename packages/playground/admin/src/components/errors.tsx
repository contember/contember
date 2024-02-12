import { ErrorAccessor } from '@contember/binding'
import { useCallback } from 'react'

export interface FormattedError {
	message: string
	type: 'validation' | 'execution' | 'unknown'
	code?: string
}

export const useErrorFormatter = () => {
	return useCallback((errors: ErrorAccessor.Error[]): FormattedError[] => {
		return errors.map((it, i) => {
			if (it.type === 'validation') {
				switch (it.code) {
					// case 'fieldRequired':
					// 	return {
					// 		...it,
					// 		message: 'This field is required',
					// 	}
					default:
						return it
				}
			} else if (it.type === 'execution') {
				if (it.code === 'UniqueConstraintViolation') {
					return {
						...it,
						message: 'Unique constraint violation',
					}
				} else {
					return {
						...it,
						message: 'Unknown error',
					}
				}
			} else {
				return {
					type: 'unknown',
					message: 'Unknown error',
				}
			}
		})
	}, [])
}
