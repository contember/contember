import { Acl, Schema } from '@contember/schema'
import { getRoleVariables } from '../acl'

export class MembershipValidator {
	async validate(schema: Schema, memberships: readonly Acl.Membership[]): Promise<MembershipValidationError[]> {
		const errors: MembershipValidationError[] = []
		const roles = schema.acl.roles
		for (const membership of memberships) {
			if (!roles[membership.role]) {
				errors.push(new MembershipValidationError(membership.role, MembershipValidationErrorType.ROLE_NOT_FOUND))
				continue
			}
			const roleVariables = getRoleVariables(membership.role, schema.acl)
			for (const variable of membership.variables) {
				if (!roleVariables[variable.name] || roleVariables[variable.name].type === Acl.VariableType.predefined) {
					errors.push(
						new MembershipValidationError(
							membership.role,
							MembershipValidationErrorType.VARIABLE_NOT_FOUND,
							variable.name,
						),
					)
				}
			}
			for (const variable of Object.keys(roleVariables)) {
				if (roleVariables[variable].type === Acl.VariableType.predefined) {
					continue
				}
				const inputVariable = membership.variables.find(it => it.name === variable)
				if (!inputVariable) {
					errors.push(
						new MembershipValidationError(membership.role, MembershipValidationErrorType.VARIABLE_EMPTY, variable),
					)
				}
			}
		}
		return errors
	}
}

export class MembershipValidationError {
	constructor(
		public readonly role: string,
		public readonly error: MembershipValidationErrorType,
		public readonly variable?: string,
	) {}
}

export enum MembershipValidationErrorType {
	ROLE_NOT_FOUND = 'roleNotFound',
	VARIABLE_NOT_FOUND = 'variableNotFound',
	VARIABLE_EMPTY = 'variableEmpty',
}
