import type { EntityAccessor, EntityListAccessor, ErrorAccessor, FieldAccessor, FieldValue } from '@contember/binding'
import { useMessageFormatter } from '../../../i18n'
import { errorCodeDictionary } from './errorCodeDictionary'
import { useMemo } from 'react'

export const useAccessorErrors = <Value extends FieldValue>(
	accessor: FieldAccessor<Value> | EntityAccessor | EntityListAccessor,
): ErrorAccessor.ValidationErrors | undefined => {
	const formatMessage = useMessageFormatter(errorCodeDictionary)
	const errors = useMemo(() => {
		return [
			...accessor.errors?.validation?.map((error): ErrorAccessor.ValidationError => {
				switch (error.code) {
					case 'fieldRequired':
						return { ...error, message: formatMessage('errorCodes.fieldRequired') }
					default:
						return error
				}
			}) ?? [],
			...accessor.errors?.execution?.map((error): ErrorAccessor.ValidationError => {
				switch (error.type) {
					case 'UniqueConstraintViolation':
						return { ...error, code: error.type, message: formatMessage('errorCodes.notUnique') }
					default:
						return { ...error, code: error.type, message: formatMessage('errorCodes.unknownExecutionError') }
				}
			}) ?? [],
		]
	}, [accessor.errors?.execution, accessor.errors?.validation, formatMessage])

	return errors.length > 0 ? (errors as ErrorAccessor.ValidationErrors) : undefined
}
