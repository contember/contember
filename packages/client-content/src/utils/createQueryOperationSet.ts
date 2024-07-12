import { ContentOperation, ContentQuery } from '../nodes'
import { ContentOperationSet } from './ContentOperationSet'
import { GraphQlField } from '@contember/graphql-builder'

export const createQueryOperationSet = (
	input: Record<string, ContentQuery<any>> | ContentQuery<any>,
): ContentOperationSet<any> => {

	if (input instanceof ContentOperation) {
		return new ContentOperationSet(
			[new GraphQlField('value', input.fieldName, input.args, input.selection)],
			it => input.parse(it.value),
		)
	}

	return new ContentOperationSet(
		Object.entries(input).map(([alias, query]) => new GraphQlField(alias, query.fieldName, query.args, query.selection)),
		res => Object.fromEntries(Object.entries(input).map(([alias, query]) => [alias, query.parse(res[alias] ?? null)])),
	)
}
