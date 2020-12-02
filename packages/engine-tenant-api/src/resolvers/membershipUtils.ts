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
	const legacyErrors = result.map(it => {
		switch (it.error) {
			case MembershipValidationErrorType.ROLE_NOT_FOUND:
				return {
					code: (MembershipErrorCode.RoleNotFound as unknown) as Code,
					endUserMessage: 'Given role not found',
					developerMessage: `Role ${it.role} is not defined in a schema`,
				}
			case MembershipValidationErrorType.VARIABLE_EMPTY:
				return {
					code: (MembershipErrorCode.VariableEmpty as unknown) as Code,
					endUserMessage: 'Required variable is empty',
					developerMessage: `Variable ${it.variable} of role ${it.role} is empty`,
				}
			case MembershipValidationErrorType.VARIABLE_NOT_FOUND:
				return {
					code: (MembershipErrorCode.VariableNotFound as unknown) as Code,
					endUserMessage: 'Provided variable does not exist',
					developerMessage: `Variable ${it.variable} of role ${it.role} is not defined in a schema`,
				}
		}
	})
	return [
		{
			code: (MembershipErrorCode.InvalidMembership as unknown) as Code,
			developerMessage: legacyErrors.map(it => it.developerMessage).join('. '),
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
				}
			}),
		},
		...legacyErrors,
	]
}
