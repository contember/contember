import { SyntheticEvent, useCallback, useState } from 'react'

interface FormMethods<V> {
	values: V
	setValues: (values: V) => void
	isSubmitting: boolean
	onSubmit: (e: SyntheticEvent) => void
	errors: FormErrors<V>
	register: <K extends keyof V>(
		field: K,
		options?: { type?: 'number' },
	) => {
		value: V[K]
		onChange: (value: V[K] | null | undefined) => void
	}
}

export type FormErrors<V> = {
	[K in keyof V]?: string
}
export type FormHandler<V> = (values: V, setError: (field: keyof V, error: string) => void, setValues: (values: V) => void) => void | Promise<any>

export const useForm = <V>(initialValues: V, handler?: FormHandler<V>): FormMethods<V> => {
	const [values, setValues] = useState<V>(initialValues)
	const [errors, setErrors] = useState<FormErrors<V>>({})
	const setError = useCallback((field: keyof V, error: string) => {
		setErrors(errors => ({ ...errors, [field]: error }))
	}, [])
	const [isSubmitting, setSubmitting] = useState(false)
	return {
		values,
		setValues,
		errors,
		isSubmitting,
		onSubmit: useCallback(async e => {
			e.preventDefault()
			setSubmitting(true)
			setErrors({})
			await handler?.(values, setError, setValues)
			setSubmitting(false)
		}, [handler, setError, values]),
		register: useCallback(
			(field, options: { type?: 'number' } = {}) => {
				return {
					name: field,
					value: values[field],
					onChange: value => {
						let nextValue: any = value

						if (options.type === 'number') {
							nextValue = Number(nextValue).toString(10) === nextValue ? Number(nextValue) : undefined
						}

						setValues(values => ({ ...values, [field]: nextValue }))
					},
				}
			},
			[values],
		),
	}
}
