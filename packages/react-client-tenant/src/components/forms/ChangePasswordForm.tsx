import { ReactElement } from 'react'
import { ChangePasswordErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm } from '../../contexts.js'
import { useChangePasswordMutation } from '../../hooks/index.js'

export type ChangePasswordFormValues = {
	password: string
	passwordConfirmation: string
}

export type ChangePasswordFormErrorCode =
	| ChangePasswordErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'PASSWORD_MISMATCH'
	| 'UNKNOWN_ERROR'

export type ChangePasswordFormState = FormState

export type ChangePasswordFormError = FormError<ChangePasswordFormValues, ChangePasswordFormErrorCode>

export type ChangePasswordFormContextValue = FormContextValue<ChangePasswordFormValues, ChangePasswordFormErrorCode>

export interface ChangePasswordFormProps {
	children: ReactElement
	personId: string
	onSuccess?: () => void
}

export const useChangePasswordForm = useForm as () => ChangePasswordFormContextValue

export const ChangePasswordForm = ({ children, onSuccess, personId }: ChangePasswordFormProps) => {
	const changePassword = useChangePasswordMutation()
	return (
		<TenantForm<ChangePasswordFormContextValue>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={{
				password: '',
				passwordConfirmation: '',
			}}
			validate={({ values }) => {
				const errors: ChangePasswordFormError[] = []
				if (!values.password) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'password' })
				} else if (values.password.length < 6) {
					errors.push({ code: 'INVALID_VALUE', field: 'password' })
				} else if (!values.passwordConfirmation) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'passwordConfirmation' })
				} else if (values.password !== values.passwordConfirmation) {
					errors.push({ code: 'PASSWORD_MISMATCH', field: 'passwordConfirmation' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await changePassword({
					personId,
					password: values.password,
				})
			}}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Partial<Record<ChangePasswordFormErrorCode, keyof ChangePasswordFormValues | undefined>> = {
	PASSWORD_MISMATCH: 'passwordConfirmation',
	TOO_WEAK: 'password',
	PERSON_NOT_FOUND: undefined,
}
