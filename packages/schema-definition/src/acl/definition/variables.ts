import { Role } from './roles.js'
import { Acl } from '@contember/schema'

export class VariableDefinition<Name extends string = string, Roles extends Role<string> = Role<string>, Variable extends Acl.Variable = Acl.Variable> {
	constructor(
		public readonly name: Name,
		public readonly roles: Roles[],
		public readonly variable: Acl.Variable,
	) {
	}
}


export const createEntityVariable = <R extends Role<string>, Name extends string>(
	name: Name,
	entityName: string,
	roles: R | R[],
): VariableDefinition<Name, R, Acl.EntityVariable> => {
	return new VariableDefinition(
		name,
		Array.isArray(roles) ? roles : [roles],
		{ type: Acl.VariableType.entity, entityName },
	)
}


export const createPredefinedVariable = <R extends Role<string>, Name extends string>(
	name: Name,
	value: Acl.PredefinedVariableValue,
	roles: R | R[],
): VariableDefinition<Name, R, Acl.EntityVariable> => {
	return new VariableDefinition(
		name,
		Array.isArray(roles) ? roles : [roles],
		{ type: Acl.VariableType.predefined, value },
	)
}

export const createConditionVariable = <R extends Role<string>, Name extends string>(
	name: Name,
	roles: R | R[],
): VariableDefinition<Name, R, Acl.ConditionVariable> => {
	return new VariableDefinition(
		name,
		Array.isArray(roles) ? roles : [roles],
		{ type: Acl.VariableType.condition  },
	)
}
