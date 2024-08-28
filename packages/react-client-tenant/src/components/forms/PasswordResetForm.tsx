import { ReactElement } from 'react'
import * as TenantApi from '@contember/graphql-client-tenant'
import { ResetPasswordErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { useResetPasswordMutation } from '../../hooks'

export type PasswordResetFormValues = {
	token: string
	password: string
	passwordConfirmation: string
}

export type PasswordResetFormErrorCode =
	| ResetPasswordErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'PASSWORD_MISMATCH'
	| 'UNKNOWN_ERROR'

export type PasswordResetFormState = FormState

export type PasswordResetFormError = FormError<PasswordResetFormValues, PasswordResetFormErrorCode>

export type PasswordResetFormContextValue = FormContextValue<PasswordResetFormValues, PasswordResetFormErrorCode>

export interface PasswordResetFormProps {
	children: ReactElement
	onSuccess?: () => void
	token?: string
}

export const usePasswordResetForm = useForm as () => PasswordResetFormContextValue

export const PasswordResetForm = ({ children, onSuccess, token }: PasswordResetFormProps) => {
	const createReset = useResetPasswordMutation()
	return (
		<TenantForm<PasswordResetFormContextValue>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={{
				token: token ?? '',
				password: '',
				passwordConfirmation: '',
			}}
			validate={({ values }) => {
				const errors: PasswordResetFormError[] = []
				if (!values.token) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'token' })
				}
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
				return await createReset({
					password: values.password,
					token: values.token,
				})
			}}
		>
			{children}
		</TenantForm>
	)

}
const errorToField: Record<TenantApi.ResetPasswordErrorCode, keyof PasswordResetFormValues | undefined> = {
	PASSWORD_TOO_WEAK: 'password',
	TOKEN_EXPIRED: 'token',
	TOKEN_NOT_FOUND: 'token',
	TOKEN_USED: 'token',
	TOKEN_INVALID: 'token',
}
