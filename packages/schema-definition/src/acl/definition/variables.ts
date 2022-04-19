import { Role } from './roles'

export class EntityVariableDefinition<Name extends string, Roles extends Role<string>> {
	public readonly type = 'entity' as const

	constructor(
		public readonly name: Name,
		public readonly entityName: string,
		public readonly roles: Roles[],
	) {
	}
}

export type VariableDefinition =
	| EntityVariableDefinition<string, Role<string>>

export const createEntityVariable = <R extends Role<string>, Name extends string>(
	name: Name,
	entityName: string,
	roles: R | R[],
): EntityVariableDefinition<Name, R> => {
	return new EntityVariableDefinition(
		name,
		entityName,
		Array.isArray(roles) ? roles : [roles],
	)
}
