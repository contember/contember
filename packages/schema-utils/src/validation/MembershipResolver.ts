import { Acl, Input } from '@contember/schema'
import { getRoleVariables } from '../acl'
import { conditionSchema } from '../type-schema'


export class MembershipResolver {
	public static UnknownIdentity = { identityId: '00000000-0000-0000-0000-000000000000' }

	resolve(
		acl: Acl.Schema,
		memberships: readonly Acl.Membership[],
		identity: {
			identityId: string
			personId?: string
		},
	): MembershipReadResult {
		const errors: MembershipValidationError[] = []
		const parsed: ParsedMembership[] = []
		const roles = acl.roles
		for (const membership of memberships) {
			if (!roles[membership.role]) {
				errors.push(new MembershipValidationError(membership.role, MembershipValidationErrorType.ROLE_NOT_FOUND))
				continue
			}
			const roleVariables = getRoleVariables(membership.role, acl)
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
			const [membershipErrors, parsedVariables] = this.readMembershipVariables(roleVariables, membership, identity)
			errors.push(...membershipErrors)
			parsed.push({
				role: membership.role,
				variables: parsedVariables,
			})
		}
		return new MembershipReadResult(errors, parsed)
	}

	private readMembershipVariables(roleVariables: Acl.Variables, membership: Acl.Membership, identity: {
		identityId: string
		personId?: string
	}): [MembershipValidationError[], ParsedMembershipVariable[]] {
		const errors: MembershipValidationError[] = []
		const parsedVariables: ParsedMembershipVariable[] = []
		for (const [name, variable] of Object.entries(roleVariables)) {
			const inputVariable = membership.variables.find(it => it.name === name)
			if (variable.type === Acl.VariableType.predefined) {
				switch (variable.value) {
					case 'identityID':
						parsedVariables.push({ name, condition: { in: [identity.identityId] } })
						break
					case 'personID':
						parsedVariables.push({
							name,
							condition: { in: identity.personId ? [identity.personId] : [] },
						})
						break
					default:
						parsedVariables.push({ name, condition: { never: true } })
						errors.push(new MembershipValidationError(membership.role, MembershipValidationErrorType.VARIABLE_INVALID, name))
						break
				}
				continue
			}

			if (!inputVariable) {
				errors.push(new MembershipValidationError(membership.role, MembershipValidationErrorType.VARIABLE_EMPTY, name))
				parsedVariables.push({ name, condition: { never: true } })
				continue
			}

			if (variable.type === Acl.VariableType.entity) {
				parsedVariables.push({ name, condition: { in: inputVariable.values } }) // todo: cast to int where primary is int

			} else if (variable.type === Acl.VariableType.condition) {
				try {
					const conditions = inputVariable.values.map(it => conditionSchema()(JSON.parse(it)))
					parsedVariables.push({
						name,
						condition: conditions.length === 1 ? conditions[0] : { or: conditions },
					})
				} catch {
					errors.push(new MembershipValidationError(membership.role, MembershipValidationErrorType.VARIABLE_INVALID, name))
					parsedVariables.push({ name, condition: { never: true } })
				}
			}
		}
		return [errors, parsedVariables]
	}
}

export class MembershipReadResult {
	constructor(
		public readonly errors: MembershipValidationError[],
		public readonly memberships: ParsedMembership[],
	) {
	}
}

export class MembershipValidationError {
	constructor(
		public readonly role: string,
		public readonly error: MembershipValidationErrorType,
		public readonly variable?: string,
	) {
	}
}

export enum MembershipValidationErrorType {
	ROLE_NOT_FOUND = 'roleNotFound',
	VARIABLE_NOT_FOUND = 'variableNotFound',
	VARIABLE_EMPTY = 'variableEmpty',
	VARIABLE_INVALID = 'variableInvalid',
}


export interface ParsedMembershipVariable {
	readonly name: string
	readonly condition: Input.Condition
}

export interface ParsedMembership {
	readonly role: string
	readonly variables: readonly ParsedMembershipVariable[]
}
