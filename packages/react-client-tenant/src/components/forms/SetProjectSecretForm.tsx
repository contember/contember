import { ReactElement } from 'react'
import { SetProjectSecretErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm } from '../../contexts.js'
import { useSetProjectSecretMutation } from '../../hooks/index.js'

export type SetProjectSecretFormValues = {
	key: string
	value: string
}

export type SetProjectSecretFormErrorCode =
	| SetProjectSecretErrorCode
	| 'FIELD_REQUIRED'
	| 'UNKNOWN_ERROR'

export type SetProjectSecretFormState = FormState

export type SetProjectSecretFormError = FormError<SetProjectSecretFormValues, SetProjectSecretFormErrorCode>

export type SetProjectSecretFormContextValue = FormContextValue<SetProjectSecretFormValues, SetProjectSecretFormErrorCode>

export interface SetProjectSecretFormProps {
	children: ReactElement
	projectSlug: string
	onSuccess?: () => void
}

export const useSetProjectSecretForm = useForm as () => SetProjectSecretFormContextValue

export const SetProjectSecretForm = ({ children, onSuccess, projectSlug }: SetProjectSecretFormProps) => {
	const setProjectSecret = useSetProjectSecretMutation()
	return (
		<TenantForm<SetProjectSecretFormContextValue>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={{
				key: '',
				value: '',
			}}
			validate={({ values }) => {
				const errors: SetProjectSecretFormError[] = []
				if (!values.key) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'key' })
				}
				if (!values.value) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'value' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await setProjectSecret({
					projectSlug,
					key: values.key,
					value: values.value,
				})
			}}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Record<SetProjectSecretErrorCode, keyof SetProjectSecretFormValues | undefined> = {
	PROJECT_NOT_FOUND: undefined,
}
