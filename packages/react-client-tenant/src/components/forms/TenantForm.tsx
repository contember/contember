import { ComponentType, ReactElement, useCallback, useEffect, useState } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { FormContextValue } from '../../types/forms'
import { FormContext } from '../../contexts'
import { useReferentiallyStableCallback } from '@contember/react-utils'

const SlotForm = Slot as ComponentType<React.FormHTMLAttributes<HTMLFormElement>>


type ExecuteResult<T extends FormContextValue<any, any, any>, OkResult = undefined> =
	| ({ ok: true } & (OkResult extends undefined ? {} : { result: OkResult }))
	| { ok: false; error?: T['errors'][number]['code']; developerMessage?: string; state?: T['state'] }

export interface TenantFormProps<T extends FormContextValue<any, any, any>, OkResult = undefined> {
	children: ReactElement
	loading?: boolean
	initialValues: T['values']
	errorMapping?: Partial<Record<T['errors'][number]['code'], keyof T['values']>>
	validate?: (args: { values: T['values']; state: T['state'] }) => T['errors'] | undefined
	execute: (args: { values: T['values']; state: T['state'] }) => Promise<ExecuteResult<T, OkResult>>
	onSuccess?: (args: { result: OkResult }) => void
	onChange?: (args: { values: T['values']; state: T['state']; submit: () => Promise<void> }) => void
}

export const TenantForm = <T extends FormContextValue<any, any, any>, OkResult = undefined>({
	children,
	initialValues,
	loading,
	errorMapping,
	validate: validateIn,
	execute: executeIn,
	onSuccess: onSuccessIn,
	onChange: onChangeIn,
}: TenantFormProps<T, OkResult>) => {
	const [values, setValues] = useState<T['values']>(initialValues)

	const [errors, setErrors] = useState<T['errors']>([])
	const [state, setState] = useState<T['state']>(loading ? 'loading' : 'initial')

	useEffect(() => {
		if (loading) {
			setState('loading')
		}
	}, [loading])

	useEffect(() => {
		if (state === 'loading' && !loading) {
			setValues(initialValues)
			setState('initial')
		}
	}, [initialValues, loading, state])

	const validate = useReferentiallyStableCallback(validateIn || (() => undefined))
	const onSuccess = useReferentiallyStableCallback(onSuccessIn || (() => undefined))
	const execute = useReferentiallyStableCallback(executeIn)

	const submit = useReferentiallyStableCallback(async (event?: React.FormEvent) => {
		event?.preventDefault()
		const errors = validate?.({ values, state }) ?? []
		setErrors(errors)

		if (errors.length > 0) {
			setState('error')
			return
		}

		setState('submitting')

		try {
			const response = await execute({ values, state })

			if (!response.ok) {
				const error = response.error
				setState(response.state ?? 'error')
				setErrors([{
					code: error || 'UNKNOWN_ERROR',
					developerMessage: response.developerMessage,
					field: errorMapping && error && error in errorMapping ? errorMapping[error] : undefined,
				}])
			} else {
				setState('success')
				setValues(initialValues)
				onSuccess?.({ result: 'result' in response ? response.result : undefined as OkResult })
			}
		} catch (e) {
			console.error(e)
			setState('error')
			setErrors([{
				code: 'UNKNOWN_ERROR',
				developerMessage: typeof e === 'string' ? e : (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') ? e.message : undefined,
			}])
		}
	})


	const onChange = useReferentiallyStableCallback(onChangeIn || (() => undefined))
	useEffect(() => {
		onChange?.({ values, state, submit })
	}, [onChange, state, submit, values])

	const setValue = useCallback((field: string, value: string) => setValues(values => ({ ...values, [field]: value })), [])

	return (
		<FormContext.Provider value={{
			values,
			setValues,
			state,
			errors,
			setValue: setValue,
		} as unknown as T}>
			<SlotForm onSubmit={submit}>
				{children}
			</SlotForm>
		</FormContext.Provider>
	)
}
