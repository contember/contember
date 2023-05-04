import { GQLVariable, useSingleTenantMutation } from '../../lib'

const CONFIRM_OTP_MUTATION = `
confirmOtp(otpToken: $token) {
	ok
	error {
		code
		developerMessage
	}
}
`

const confirmOtpVariables = {
	token: GQLVariable.Required(GQLVariable.String),
}

export type ConfirmOtpErrors =
	| 'INVALID_OTP_TOKEN'
	| 'NOT_PREPARED'

export const useConfirmOtp = () => {
	return useSingleTenantMutation<never, ConfirmOtpErrors, typeof confirmOtpVariables>(
		CONFIRM_OTP_MUTATION,
		confirmOtpVariables,
	)
}
