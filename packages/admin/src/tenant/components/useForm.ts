import { SyntheticEvent, useCallback, useState } from 'react'

interface FormMethods<V> {
	values: V
	register: <K extends keyof V>(
		field: K,
		options?: { type?: 'number' },
	) => {
		value: V[K]
		onChange: (args: (SyntheticEvent & { currentTarget: { value: V[K] } }) | V[K]) => void
	}
}

export const useForm = <V>(initialValues: V): FormMethods<V> => {
	const [values, setValues] = useState<V>(initialValues)
	return {
		values,
		register: useCallback(
			(field, options: { type?: 'number' } = {}) => {
				return {
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
