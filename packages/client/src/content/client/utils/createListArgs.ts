import { SchemaEntityNames } from '../types/Schema'
import { GraphQlFieldTypedArgs } from '../../../builder'

export const createListArgs = (entity: SchemaEntityNames<string>, args: { filter?: any, orderBy?: any, limit?: number, offset?: number }, type: 'list' | 'paginate' = 'list'): GraphQlFieldTypedArgs => {
	return {
		filter: {
			graphQlType: `${entity.name}Where`,
			value: args.filter,
		},
		orderBy: {
			graphQlType: `[${entity.name}OrderBy!]`,
			value: args.orderBy,
		},
		[type === 'list' ? 'limit' : 'first']: {
			graphQlType: 'Int',
			value: args.limit,
		},
		[type === 'list' ? 'offset' : 'skip']: {
			graphQlType: 'Int',
			value: args.offset,
		},
	}
}
