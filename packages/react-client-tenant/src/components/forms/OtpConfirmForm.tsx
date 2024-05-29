import { ReactElement } from 'react'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm, useIdentityMethods } from '../../contexts'
import { ConfirmOtpErrorCode } from '@contember/graphql-client-tenant'
import { useConfirmOtpMutation } from '../../hooks'

export type OtpConfirmFormValues = {
	otpToken: string
}

export type OtpConfirmFormErrorCode =
	| ConfirmOtpErrorCode
	| 'FIELD_REQUIRED'
	| 'UNKNOWN_ERROR'

export type OtpConfirmFormState = FormState

export type OtpConfirmFormError = FormError<OtpConfirmFormValues, OtpConfirmFormErrorCode>

export type OtpConfirmFormContextValue = FormContextValue<OtpConfirmFormValues, OtpConfirmFormErrorCode>

export interface OtpConfirmFormProps {
	children: ReactElement
	onSuccess?: () => void
}

export const useOtpConfirmForm = useForm as () => OtpConfirmFormContextValue

export const OtpConfirmForm = ({ children, onSuccess }: OtpConfirmFormProps) => {
	const confirmOtp = useConfirmOtpMutation()
	const { refreshIdentity } = useIdentityMethods()
	return (
		<TenantForm<OtpConfirmFormContextValue>
			onSuccess={async args => {
				await refreshIdentity()
				onSuccess?.()
			}}
			initialValues={{
				otpToken: '',
			}}
			validate={({ values }) => {
				if (!values.otpToken) {
					return [{ code: 'FIELD_REQUIRED', field: 'otpToken' }]
				}
			}}
			execute={async ({ values }) => {
				return await confirmOtp({
					 otpToken: values.otpToken,
				})
			}}
			errorMapping={{
				INVALID_OTP_TOKEN: 'otpToken',
				NOT_PREPARED: 'otpToken',
			}}
		>
			{children}
		</TenantForm>
	)
}

