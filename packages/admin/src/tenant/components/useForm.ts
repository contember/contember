import { SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react'

interface FormMethods<V> {
	values: V
	isSubmitting: boolean
	onSubmit: (e: SyntheticEvent) => void
	errors: FormErrors<V>
	register: <K extends keyof V>(
		field: K,
		options?: { type?: 'number' },
	) => {
		value: V[K]
		onChange: (args: (SyntheticEvent & { currentTarget: { value: V[K] } }) | V[K]) => void
	}
}

type FormErrors<V> = {
	[K in keyof V]?: string
}
type FormHandler<V> = (values: V, setError: (field: keyof V, error: string) => void) => void | Promise<any>

export const useForm = <V>(initialValues: V, handler?: FormHandler<V>): FormMethods<V> => {
	const [values, setValues] = useState<V>(initialValues)
	const [errors, setErrors] = useState<FormErrors<V>>({})
	const setError = useCallback((field: keyof V, error: string) => {
		setErrors(errors => ({ ...errors, [field]: error }))
	}, [])
	const [isSubmitting, setSubmitting] = useState(false)
	return {
		values,
		errors,
		isSubmitting,
		onSubmit: useCallback(async e => {
			e.preventDefault()
			setSubmitting(true)
			setErrors({})
			await handler?.(values, setError)
			setSubmitting(false)
			setValues(initialValues)
		}, [handler, initialValues, setError, values]),
		register: useCallback(
			(field, options: { type?: 'number' } = {}) => {
				return {
					name: field,
					value: values[field],
					onChange: arg => {
						let value: any =
							typeof arg === 'object' && arg !== null && 'currentTarget' in arg ? arg.currentTarget.value : arg
						if (options.type === 'number') {
							value = Number(value).toString(10) === value ? Number(value) : undefined
						}
						setValues(values => ({ ...values, [field]: value }))
					},
				}
			},
			[values],
		),
	}
}
