import { ReactElement } from 'react'
import { ChangeMyPasswordErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { useChangeMyPasswordMutation } from '../../hooks'

export type ChangeMyPasswordFormValues = {
	currentPassword: string
	newPassword: string
	passwordConfirmation: string
}

export type ChangeMyPasswordFormErrorCode =
	| ChangeMyPasswordErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'PASSWORD_MISMATCH'
	| 'UNKNOWN_ERROR'

export type ChangeMyPasswordFormState = FormState

export type ChangeMyPasswordFormError = FormError<ChangeMyPasswordFormValues, ChangeMyPasswordFormErrorCode>

export type ChangeMyPasswordFormContextValue = FormContextValue<ChangeMyPasswordFormValues, ChangeMyPasswordFormErrorCode>

export interface ChangeMyPasswordFormProps {
	children: ReactElement
	onSuccess?: () => void
}

export const useChangeMyPasswordForm = useForm as () => ChangeMyPasswordFormContextValue

export const ChangeMyPasswordForm = ({ children, onSuccess }: ChangeMyPasswordFormProps) => {
	const changePassword = useChangeMyPasswordMutation()
	return (
		<TenantForm<ChangeMyPasswordFormContextValue>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={{
				currentPassword: '',
				newPassword: '',
				passwordConfirmation: '',
			}}
			validate={({ values }) => {
				const errors: ChangeMyPasswordFormError[] = []
				if (!values.currentPassword) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'currentPassword' })
				}
				if (!values.newPassword) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'newPassword' })
				} else if (values.newPassword.length < 6) {
					errors.push({ code: 'INVALID_VALUE', field: 'newPassword' })
				} else if (!values.passwordConfirmation) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'passwordConfirmation' })
				} else if (values.newPassword !== values.passwordConfirmation) {
					errors.push({ code: 'PASSWORD_MISMATCH', field: 'passwordConfirmation' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await changePassword(values)
			}}
		>
			{children}
		</TenantForm>
	)

}
const errorToField: Partial<Record<ChangeMyPasswordFormErrorCode, keyof ChangeMyPasswordFormValues | undefined>> = {
	PASSWORD_MISMATCH: 'passwordConfirmation',
	TOO_WEAK: 'newPassword',
	NO_PASSWORD_SET: 'currentPassword',
	INVALID_PASSWORD: 'currentPassword',
}
