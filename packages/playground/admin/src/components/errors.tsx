import { ErrorAccessor } from '@contember/binding'
import { ReactNode, useCallback } from 'react'

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
					return 'Unique constraint violation'
				} else {
					return 'Unknown error'
				}
			} else {
				return 'Unknown error'
			}
		})
	}, [])
}
