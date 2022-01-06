import { ProjectGroup, ProjectSchemaResolver } from '../type'
import { Membership } from '../type/Membership'
import { getRoleVariables } from '@contember/schema-utils'

export class MembershipValidator {
	constructor(private readonly schemaResolver: ProjectSchemaResolver) {}

	async validate(projectGroup: ProjectGroup, project: string, memberships: readonly Membership[]): Promise<MembershipValidationError[]> {
		const schema = await this.schemaResolver.getSchema(projectGroup, project)
		if (!schema) {
			throw new Error()
		}
		const errors: MembershipValidationError[] = []
		const roles = schema.acl.roles
		for (const membership of memberships) {
			if (!roles[membership.role]) {
				errors.push(new MembershipValidationError(membership.role, MembershipValidationErrorType.ROLE_NOT_FOUND))
				continue
			}
			const roleVariables = getRoleVariables(membership.role, schema.acl)
			for (const variable of membership.variables) {
				if (!roleVariables[variable.name]) {
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
				const inputVariable = membership.variables.find(it => it.name === variable)
				if (!inputVariable || inputVariable.values.length === 0) {
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
