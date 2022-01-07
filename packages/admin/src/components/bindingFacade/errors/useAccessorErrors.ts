import type { ErrorAccessor } from '@contember/binding'
import { MessageFormatter, useMessageFormatter } from '../../../i18n'
import { errorCodeDictionary } from './errorCodeDictionary'
import { useCallback, useMemo } from 'react'

export interface AccessorErrorsHolder {
	readonly errors: ErrorAccessor | undefined
}

export interface AccessorErrorMessage { message: string }
export type AccessorErrorMessages = [AccessorErrorMessage, ...AccessorErrorMessage[]]

export const useAccessorErrorFormatter = () => {
	const formatMessage = useMessageFormatter(errorCodeDictionary)
	return useCallback((accessor: AccessorErrorsHolder): AccessorErrorMessage[] => {
		return [
			...accessor.errors?.validation?.map((error): AccessorErrorMessage => {
				switch (error.code) {
					case 'fieldRequired':
						return { message: formatMessage('errorCodes.fieldRequired') }
					default:
						return error
				}
			}) ?? [],
			...accessor.errors?.execution?.map((error): AccessorErrorMessage => {
				switch (error.type) {
					case 'UniqueConstraintViolation':
						return { message: formatMessage('errorCodes.notUnique') }
					default:
						return { message: formatMessage('errorCodes.unknownExecutionError') }
				}
			}) ?? [],
		]
	}, [formatMessage])
}

export const useAccessorErrors = (accessor: AccessorErrorsHolder): AccessorErrorMessages | undefined => {
	const errorFormatter = useAccessorErrorFormatter()
	const errors = useMemo(() => errorFormatter(accessor), [accessor, errorFormatter])

	return errors.length > 0 ? (errors as AccessorErrorMessages) : undefined
}
