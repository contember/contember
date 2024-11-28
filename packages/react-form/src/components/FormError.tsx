import { cloneElement, ReactElement, ReactNode, useMemo } from 'react'
import { useFormFieldState } from '../contexts'
import { BindingError, ErrorAccessor } from '@contember/react-binding'

export const FormError = ({ children, formatter }: {
	formatter: (errors: ErrorAccessor.Error[]) => ReactNode[]
	children: ReactElement
}) => {
	const formState = useFormFieldState()
	if (!formState) {
		throw new BindingError('FormError must be used inside a FormField')
	}
	const { errors, htmlId } = formState
	const formatted = useMemo(() => formatter(errors ?? []).filter((it, index, arr) => arr.indexOf(it) === index), [errors, formatter])
	return formatted.map((it, index) => {
		return cloneElement(children, {
			key: index,
			...(htmlId ? { id: `${htmlId}-error-${index}` } : {}),
			children: it,
		})
	})
}
