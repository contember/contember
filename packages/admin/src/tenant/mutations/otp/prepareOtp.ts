import { GQLVariable, useSingleTenantMutation } from '../../lib/facade'

const PREPARE_OTP_MUTATION = `
prepareOtp(label: $label) {
	ok
	result {
		otpUri
		otpSecret
	}
}
`

const prepareOtmVariables = {
	label: GQLVariable.String,
}


export interface PrepareOtpResult {
	otpUri: string
	otpSecret: string
}

export const usePrepareOtp = () => {
	return useSingleTenantMutation<PrepareOtpResult, never, typeof prepareOtmVariables>(
		PREPARE_OTP_MUTATION,
		prepareOtmVariables,
	)
}
