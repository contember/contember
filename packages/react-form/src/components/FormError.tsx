import { cloneElement, ReactElement, ReactNode, useMemo } from 'react'
import { useFormError, useFormFieldId } from '../contexts'
import { BindingError, ErrorAccessor } from '@contember/react-binding'

export const FormError = ({ children, formatter }: {
	formatter: (errors: ErrorAccessor.Error[]) => ReactNode[]
	children: ReactElement
}) => {
	const errors = useFormError()
	const id = useFormFieldId()
	const formatted = useMemo(() => formatter(errors ?? []), [errors, formatter])
	if (errors === undefined || id === undefined) {
		throw new BindingError('FormError must be used inside a FormField')
	}
	return formatted.map((it, index) => {
		return cloneElement(children, {
			key: index,
			...{ id: `${id}-error-${index}` },
			children: it,
		})
	})
}
