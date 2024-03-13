import type { ErrorAccessor } from '@contember/react-binding'
import { assertNever } from '@contember/utilities'
import { useCallback, useMemo } from 'react'
import { useMessageFormatter } from '@contember/react-i18n'
import { errorCodeDictionary } from './errorCodeDictionary'


export interface AccessorErrorMessage { message: string }
export type AccessorErrorMessages = [AccessorErrorMessage, ...AccessorErrorMessage[]]

export const useAccessorErrorFormatter = () => {
	const formatMessage = useMessageFormatter(errorCodeDictionary)
	return useCallback((errors: ErrorAccessor.Error[]): AccessorErrorMessage[] => {
		return errors.map((error): AccessorErrorMessage => {
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
		})
	}, [formatMessage])
}

export const useAccessorErrors = (errorAccessor: ErrorAccessor.Error[] | undefined): AccessorErrorMessages | undefined => {
	const errorFormatter = useAccessorErrorFormatter()
	const errors = useMemo(() => errorFormatter(errorAccessor ?? []), [errorAccessor, errorFormatter])

	return errors.length > 0 ? (errors as AccessorErrorMessages) : undefined
}
