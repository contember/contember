import { ReactElement } from 'react'
import { ConfirmEmailOtpErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm, useIdentityMethods } from '../../contexts.js'
import { ConfirmEmailOtpMutationResult, useConfirmEmailOtpMutation } from '../../hooks/index.js'

export type EmailOtpConfirmFormValues = {
	otpToken: string
}

export type EmailOtpConfirmFormErrorCode =
	| ConfirmEmailOtpErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type EmailOtpConfirmFormState = FormState

export type EmailOtpConfirmFormError = FormError<EmailOtpConfirmFormValues, EmailOtpConfirmFormErrorCode>

export type EmailOtpConfirmFormContextValue = FormContextValue<EmailOtpConfirmFormValues, EmailOtpConfirmFormErrorCode>

export interface EmailOtpConfirmFormProps {
	children: ReactElement
	/** The result carries freshly issued backup codes — show them once, they are not retrievable later. */
	onSuccess?: (args: { result: ConfirmEmailOtpMutationResult }) => void
}

export const useEmailOtpConfirmForm = useForm as () => EmailOtpConfirmFormContextValue

export const EmailOtpConfirmForm = ({ children, onSuccess }: EmailOtpConfirmFormProps) => {
	const confirmEmailOtp = useConfirmEmailOtpMutation()
	const { refreshIdentity } = useIdentityMethods()
	return (
		<TenantForm<EmailOtpConfirmFormContextValue, ConfirmEmailOtpMutationResult>
			onSuccess={async args => {
				await refreshIdentity()
				onSuccess?.(args)
			}}
			initialValues={{
				otpToken: '',
			}}
			validate={({ values }) => {
				if (!values.otpToken) {
					return [{ code: 'FIELD_REQUIRED', field: 'otpToken' }]
				}
				if (!values.otpToken.match(/^\d{6}$/)) {
					return [{ code: 'INVALID_VALUE', field: 'otpToken' }]
				}
			}}
			execute={async ({ values }) => {
				return await confirmEmailOtp({
					otpToken: values.otpToken,
				})
			}}
			errorMapping={{
				INVALID_OTP_TOKEN: 'otpToken',
			}}
		>
			{children}
		</TenantForm>
	)
}
