import { capitalizeFirstLetter } from '../utils/index.js'
import { GraphQLFieldResolver } from 'graphql'
import { Model } from '@contember/schema'

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

/**
 * Description of a GraphQL input field derived from a schema field.
 * Input fields are not marked as deprecated, because standard introspection hides deprecated input values,
 * so the deprecation reason becomes part of the description instead.
 */
export const inputFieldDescription = (field: Model.AnyField): string | undefined => {
	if (field.deprecationReason === undefined) {
		return field.description
	}
	const note = `Deprecated: ${field.deprecationReason}`
	return field.description ? `${field.description}\n\n${note}` : note
}
