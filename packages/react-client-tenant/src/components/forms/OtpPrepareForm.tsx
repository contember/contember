import { ReactElement, useCallback, useMemo } from 'react'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { PrepareOtpMutationResult, usePrepareOtpMutation } from '../../hooks'

export type OtpPrepareFormValues = {
	label: string
}

export type OtpPrepareFormErrorCode =
	| 'UNKNOWN_ERROR'

export type OtpPrepareFormState = FormState

export type OtpPrepareFormError = FormError<OtpPrepareFormValues, OtpPrepareFormErrorCode>

export type OtpPrepareFormContextValue = FormContextValue<OtpPrepareFormValues, OtpPrepareFormErrorCode>

export interface OtpPrepareFormProps {
	children: ReactElement
	onSuccess?: (args: { result: PrepareOtpMutationResult }) => void
}

export const useOtpPrepareForm = useForm as () => OtpPrepareFormContextValue

export const OtpPrepareForm = ({ children, onSuccess }: OtpPrepareFormProps) => {
	const prepareOtp = usePrepareOtpMutation()
	return (
		<TenantForm<OtpPrepareFormContextValue, PrepareOtpMutationResult>
			onSuccess={onSuccess}
			initialValues={{
				label: window.location.hostname,
			}}
			execute={async ({ values }) => {
				return await prepareOtp({
					label: values.label,
				})
			}}
		>
			{children}
		</TenantForm>
	)
}

