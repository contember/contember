import type { EntityAccessor, EntityListAccessor, ErrorAccessor, FieldAccessor } from '@contember/binding'
import { useMessageFormatter } from '../../../i18n'
import { errorCodeDictionary } from './errorCodeDictionary'

export const useAccessorErrors = (
	accessor: FieldAccessor | EntityAccessor | EntityListAccessor,
): ErrorAccessor.ValidationErrors | undefined => {
	const formatMessage = useMessageFormatter(errorCodeDictionary)

	if (!accessor.errors || !accessor.errors.validation) {
		return undefined
	}
	return accessor.errors.validation.map((error): ErrorAccessor.ValidationError => {
		switch (error.code) {
			case 'fieldRequired':
				return { ...error, message: formatMessage('errorCodes.fieldRequired') }
			default:
				return error
		}
	}) as ErrorAccessor.ValidationErrors
}
