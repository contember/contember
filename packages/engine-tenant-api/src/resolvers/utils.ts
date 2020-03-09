import { MembershipValidationError, MembershipValidationErrorType } from '../model/service/MembershipValidator'

export enum MembershipErrorCode {
	RoleNotFound = 'ROLE_NOT_FOUND',
	VariableEmpty = 'VARIABLE_EMPTY',
	VariableNotFound = 'VARIABLE_NOT_FOUND',
}

export interface MembershipErrorVariable<Code> {
	code: Code
	endUserMessage?: string
	developerMessage?: string
}

export const createMembershipValidationErrorResult = <Code>(
	result: MembershipValidationError[],
): MembershipErrorVariable<Code>[] =>
	result.map(it => {
		switch (it.error) {
			case MembershipValidationErrorType.ROLE_NOT_FOUND:
				return {
					code: (MembershipErrorCode.RoleNotFound as unknown) as Code,
					endUserMessage: 'Given role not found',
					developerMessage: `Role ${it.role} is not defined in a schema`,
				}
			case MembershipValidationErrorType.VARIABLE_NOT_SET:
				return {
					code: (MembershipErrorCode.VariableEmpty as unknown) as Code,
					endUserMessage: 'Required variable was not set',
					developerMessage: `Variable ${it.variable} of role ${it.role} was not provided`,
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
