import { ContentMutation, ContentOperation, ContentQuery } from '../nodes'
import { GraphQlField } from '@contember/graphql-builder'
import { ContentOperationSet } from './ContentOperationSet'

export const createMutationOperationSet = (
	input:
		| Record<string, ContentMutation<any> | ContentQuery<any>>
		| ContentMutation<any>
		| ContentMutation<any>[],
): ContentOperationSet<any> => {

	if (input instanceof ContentOperation) {
		return new ContentOperationSet(
			[new GraphQlField('mut', input.fieldName, input.args, input.selection)],
			it => input.parse(it.mut),
		)
	}

	if (Array.isArray(input)) {
		return new ContentOperationSet(
			input.map((mut, i) => new GraphQlField('mut_' + i++, mut.fieldName, mut.args, mut.selection)),
			data => input.map((mut, i) => mut.parse(data['mut_' + i] ?? null)),
		)
	}

	return new ContentOperationSet(
		Object.entries(input).map(([alias, mutation]) => {
			if (mutation.type === 'query') {
				return new GraphQlField(alias, 'query', {}, [
					new GraphQlField('value', mutation.fieldName, mutation.args, mutation.selection),
				])
			}
			return new GraphQlField(alias, mutation.fieldName, mutation.args, mutation.selection)
		}),
		res => Object.fromEntries(Object.entries(input).map(([alias, mutation]) => {
			if (mutation.type === 'query') {
				return [alias, mutation.parse(res[alias]?.value ?? null)]
			}
			return [alias, mutation.parse(res[alias] ?? null)]
		})),
	)
}
