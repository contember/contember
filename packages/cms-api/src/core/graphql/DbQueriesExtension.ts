import { GraphQLExtension } from 'graphql-extensions'

type Query = { sql: string; bindings: any; elapsed: number; error?: string; options?: any }

export default class DbQueriesExtension extends GraphQLExtension {
	private readonly queries: Query[] = []

	addQuery(query: Query): void {
		this.queries.push(query)
	}

	format(): [string, any] | undefined {
		return [
			'dbQueries',
			this.queries.map(it => ({
				...it,
				path: (it.options && it.options.meta && it.options.meta.path) || [],
			})),
		]
	}
}
