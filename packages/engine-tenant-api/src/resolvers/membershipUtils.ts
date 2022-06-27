import { MembershipValidationError, MembershipValidationErrorType } from '../model/service/MembershipValidator'
import { MembershipValidationError as MembershipValidationErrorSchema, MembershipValidationErrorCode } from '../schema'

export enum MembershipErrorCode {
	InvalidMembership = 'INVALID_MEMBERSHIP',
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
}

export interface MembershipErrorVariable<Code> {
	code: Code
	membershipValidation?: MembershipValidationErrorSchema[]
	endUserMessage?: string
	developerMessage: string
}

export const createMembershipValidationErrorResult = <Code>(
	result: MembershipValidationError[],
): MembershipErrorVariable<Code>[] => {
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

	const legacyErrors = result.map((it): MembershipErrorVariable<Code> | undefined => {
		switch (it.error) {
			case MembershipValidationErrorType.ROLE_NOT_FOUND:
				return {
					code: MembershipErrorCode.RoleNotFound as unknown as Code,
					endUserMessage: 'Given role not found',
					developerMessage: formatDeveloperError(it),
				}
			case MembershipValidationErrorType.VARIABLE_EMPTY:
				return {
					code: MembershipErrorCode.VariableEmpty as unknown as Code,
					endUserMessage: 'Required variable is empty',
					developerMessage: formatDeveloperError(it),
				}
			case MembershipValidationErrorType.VARIABLE_NOT_FOUND:
				return {
					code: MembershipErrorCode.VariableNotFound as unknown as Code,
					endUserMessage: 'Provided variable does not exist',
					developerMessage: formatDeveloperError(it),
				}
		}
	}).filter((it): it is MembershipErrorVariable<Code> => it !== undefined)

	return [
		{
			code: MembershipErrorCode.InvalidMembership as unknown as Code,
			developerMessage:
				'Provided membership is invalid: ' +
				result.map(it => formatDeveloperError(it)).join('. ') +
				'. You can also check membershipValidation field for structured details.',
			membershipValidation: result.map(it => {
				switch (it.error) {
					case MembershipValidationErrorType.ROLE_NOT_FOUND:
						return {
							code: MembershipValidationErrorCode.RoleNotFound,
							role: it.role,
						}
					case MembershipValidationErrorType.VARIABLE_EMPTY:
						return {
							code: MembershipValidationErrorCode.VariableEmpty,
							role: it.role,
							variable: it.variable,
						}
					case MembershipValidationErrorType.VARIABLE_NOT_FOUND:
						return {
							code: MembershipValidationErrorCode.VariableNotFound,
							role: it.role,
							variable: it.variable,
						}
					case MembershipValidationErrorType.VARIABLE_INVALID:
						return {
							code: MembershipValidationErrorCode.VariableInvalid,
							role: it.role,
							variable: it.variable,
						}
				}
			}),
		},
		...legacyErrors,
	]
}
