import { FormContextValue } from '@contember/react-identity'
import { useState } from 'react'
import { FormErrorMessages, TenantFormField } from './common.js'

export interface MfaCodeFieldsLabels {
	otpToken: string
	backupCode: string
	/** Link out of the authenticator step, for someone who lost their device. */
	useBackupCode: string
	/** Link back to the authenticator step. */
	useOtpToken: string
}

export interface MfaCodeFieldsProps<CtxValue extends FormContextValue<any, any, any>> {
	form: CtxValue
	messages: FormErrorMessages<CtxValue>
	labels: MfaCodeFieldsLabels
}

/**
 * The second sign-in step: an authenticator code, or a backup code for whoever lost their
 * authenticator. Only one input is mounted at a time — with both on screen the native `required` on
 * the OTP field blocks submitting a backup code, which left account recovery unreachable.
 */
export const MfaCodeFields = <CtxValue extends FormContextValue<any, any, any>>({ form, messages, labels }: MfaCodeFieldsProps<CtxValue>) => {
	const [useBackupCode, setUseBackupCode] = useState(false)

	const switchTo = (backupCode: boolean) => {
		// Clear whichever field is being left behind: both are submitted, and a stale OTP value would
		// fail the six-digit check before the backup code is ever looked at.
		form.setValue(backupCode ? 'otpToken' : 'backupCode', '')
		setUseBackupCode(backupCode)
	}

	return (
		<>
			{useBackupCode
				? (
					<TenantFormField
						form={form}
						messages={messages}
						field="backupCode"
						autoComplete="one-time-code"
						type="text"
						required
						autoFocus
					>
						{labels.backupCode}
					</TenantFormField>
				)
				: (
					<TenantFormField
						form={form}
						messages={messages}
						field="otpToken"
						autoComplete="one-time-code"
						type="text"
						required
						autoFocus
						maxLength={6}
					>
						{labels.otpToken}
					</TenantFormField>
				)}
			<button
				type="button"
				className="self-start text-sm text-gray-500 underline"
				onClick={() => switchTo(!useBackupCode)}
			>
				{useBackupCode ? labels.useOtpToken : labels.useBackupCode}
			</button>
		</>
	)
}
