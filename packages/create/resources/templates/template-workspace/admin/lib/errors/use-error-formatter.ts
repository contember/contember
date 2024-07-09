import { ReactNode, useCallback } from 'react'
import { dict } from '../dict'
import { ErrorAccessor } from '@contember/interface'

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
