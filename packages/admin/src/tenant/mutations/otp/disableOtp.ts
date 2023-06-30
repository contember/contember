import { useSingleTenantMutation } from '../../lib'

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

export type DisableOtpErrors =
	| 'OTP_NOT_ACTIVE'

export const useDisableOtp = () => {
	return useSingleTenantMutation<never, DisableOtpErrors, typeof disableOtpVariables>(
		DisableOtpMutation,
		disableOtpVariables,
	)
}
