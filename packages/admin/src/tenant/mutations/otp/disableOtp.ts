import { GQLVariable, useSingleTenantMutation } from '../../lib'

const DisableOtpMutation = `
disableOtp {
	ok
	error {
		code
		developerMessage
	}
}
`

const disableOtpVariables = {}

type ConfirmOtpErrors =
	| 'OTP_NOT_ACTIVE'

export const useDisableOtp = () => {
	return useSingleTenantMutation<never, ConfirmOtpErrors, typeof disableOtpVariables>(
		DisableOtpMutation,
		disableOtpVariables,
	)
}
