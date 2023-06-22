import { MembershipValidationError, MembershipValidationErrorType } from '../model/service/MembershipValidator'
import { MembershipValidationError as MembershipValidationErrorSchema, MembershipValidationErrorCode } from '../schema'

export type MembershipErrorCode =
	| 'INVALID_MEMBERSHIP'
	| 'ROLE_NOT_FOUND'
	| 'VARIABLE_EMPTY'
	| 'VARIABLE_NOT_FOUND'


export interface MembershipErrorVariable {
	code: MembershipErrorCode
	membershipValidation?: MembershipValidationErrorSchema[]
	endUserMessage?: string
	developerMessage: string
}

export const createMembershipValidationErrorResult = (
	result: MembershipValidationError[],
): MembershipErrorVariable[] => {
	const formatDeveloperError = (it: MembershipValidationError) => {
		switch (it.error) {
			case MembershipValidationErrorType.ROLE_NOT_FOUND:
				return `Role ${it.role} is not defined in a schema`
			case MembershipValidationErrorType.VARIABLE_EMPTY:
				return `Variable ${it.variable} of role ${it.role} is empty`
			case MembershipValidationErrorType.VARIABLE_NOT_FOUND:
				return `Variable ${it.variable} of role ${it.role} is not defined in a schema`
			case MembershipValidationErrorType.VARIABLE_INVALID:
				return `Variable ${it.variable} of role ${it.role} contains invalid value`
		}
	}

	const legacyErrors = result.map((it): MembershipErrorVariable | undefined => {
		switch (it.error) {
			case MembershipValidationErrorType.ROLE_NOT_FOUND:
				return {
					code: 'ROLE_NOT_FOUND',
					endUserMessage: 'Given role not found',
					developerMessage: formatDeveloperError(it),
				}
			case MembershipValidationErrorType.VARIABLE_EMPTY:
				return {
					code: 'VARIABLE_EMPTY',
					endUserMessage: 'Required variable is empty',
					developerMessage: formatDeveloperError(it),
				}
			case MembershipValidationErrorType.VARIABLE_NOT_FOUND:
				return {
					code: 'VARIABLE_NOT_FOUND',
					endUserMessage: 'Provided variable does not exist',
					developerMessage: formatDeveloperError(it),
				}
		}
	}).filter((it): it is MembershipErrorVariable => it !== undefined)

	return [
		{
			code: 'INVALID_MEMBERSHIP',
			developerMessage:
				'Provided membership is invalid: ' +
				result.map(it => formatDeveloperError(it)).join('. ') +
				'. You can also check membershipValidation field for structured details.',
			membershipValidation: result.map((it): MembershipValidationErrorSchema => {
				switch (it.error) {
					case MembershipValidationErrorType.ROLE_NOT_FOUND:
						return {
							code: 'ROLE_NOT_FOUND',
							role: it.role,
						}
					case MembershipValidationErrorType.VARIABLE_EMPTY:
						return {
							code: 'VARIABLE_EMPTY',
							role: it.role,
							variable: it.variable,
						}
					case MembershipValidationErrorType.VARIABLE_NOT_FOUND:
						return {
							code: 'VARIABLE_NOT_FOUND',
							role: it.role,
							variable: it.variable,
						}
					case MembershipValidationErrorType.VARIABLE_INVALID:
						return {
							code: 'VARIABLE_INVALID',
							role: it.role,
							variable: it.variable,
						}
				}
			}),
		},
		...legacyErrors,
	]
}
