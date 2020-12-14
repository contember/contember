import { capitalizeFirstLetter } from '../utils'
import { GraphQLFieldResolver } from 'graphql/type/definition'

export const GqlTypeName = (strings: TemplateStringsArray, ...values: string[]) => {
	return strings.reduce((combined, string, i) => {
		return combined + string + (i < values.length ? capitalizeFirstLetter(values[i]) : '')
	}, '')
}

export const aliasAwareResolver: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
	if (!info.path) {
		return undefined
	}
	return source[info.path.key]
}
