import type { ErrorAccessor } from '@contember/binding'
import { useMessageFormatter } from '../../../i18n'
import { errorCodeDictionary } from './errorCodeDictionary'
import { useCallback, useMemo } from 'react'
import { assertNever } from '../../../utils'

export interface AccessorErrorsHolder {
	readonly errors: ErrorAccessor | undefined
}

export interface AccessorErrorMessage { message: string }
export type AccessorErrorMessages = [AccessorErrorMessage, ...AccessorErrorMessage[]]

export const useAccessorErrorFormatter = () => {
	const formatMessage = useMessageFormatter(errorCodeDictionary)
	return useCallback((accessor: AccessorErrorsHolder): AccessorErrorMessage[] => {
		return accessor.errors?.errors.map((error): AccessorErrorMessage => {
			if (error.type === 'validation') {
				switch (error.code) {
					case 'fieldRequired':
						return { message: formatMessage('errorCodes.fieldRequired') }
					default:
						return error
				}
			} else if (error.type === 'execution') {
				switch (error.code) {
					case 'UniqueConstraintViolation':
						return { message: formatMessage('errorCodes.notUnique') }
					default:
						return { message: formatMessage('errorCodes.unknownExecutionError') }
				}
			}
			assertNever(error)
		}) ?? []
	}, [formatMessage])
}

export const useAccessorErrors = (accessor: AccessorErrorsHolder): AccessorErrorMessages | undefined => {
	const errorFormatter = useAccessorErrorFormatter()
	const errors = useMemo(() => errorFormatter(accessor), [accessor, errorFormatter])

	return errors.length > 0 ? (errors as AccessorErrorMessages) : undefined
}
