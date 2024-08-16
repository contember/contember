import { GraphQlFieldTypedArgs } from '@contember/graphql-builder'

export const createTypedArgs = <TArgs extends Record<string, any>>(
	args: TArgs,
	types: { [key in keyof TArgs]: string },
): GraphQlFieldTypedArgs => {
	const typedArgs: GraphQlFieldTypedArgs = {}
	for (const key in args) {
		if (!types.hasOwnProperty(key)) {
			throw new Error(`Unknown argument ${key}`)
		}
		typedArgs[key] = {
			graphQlType: types[key],
			value: args[key],
		}
	}
	return typedArgs
}
