import { mutationFragments } from './utils/mutationFragments'
import { GraphQlClientRequestOptions } from '@contember/graphql-client'
import { GraphQlQueryPrinter } from '@contember/graphql-builder'
import { ContentMutation, ContentQuery } from './nodes'
import { createMutationOperationSet } from './utils/createMutationOperationSet'
import { createQueryOperationSet } from './utils/createQueryOperationSet'


export type QueryExecutorOptions = GraphQlClientRequestOptions

export type QueryExecutor = <T = unknown>(query: string, options: GraphQlClientRequestOptions) => Promise<T>

export class ContentClient {
	constructor(
		private readonly executor: QueryExecutor,
	) {
	}


	public async query<Value>(query: ContentQuery<Value>, options?: QueryExecutorOptions): Promise<Value>
	public async query<Values extends Record<string, any>>(queries: {[K in keyof Values]: ContentQuery<Values[K]>}, options?: QueryExecutorOptions): Promise<Values>
	public async query(queries: Record<string, ContentQuery<any>> | ContentQuery<any>, options?: QueryExecutorOptions): Promise<any> {
		const printer = new GraphQlQueryPrinter()
		const operationSet = createQueryOperationSet(queries)
		const { query, variables } = printer.printDocument('query', operationSet.selection, {})
		const result = await this.executor(query, { variables, ...options })
		return operationSet.parse(result)
	}

	public async mutate<Value>(mutation: ContentMutation<Value>, options?: QueryExecutorOptions,): Promise<Value>
	public async mutate<Value>(mutations: ContentMutation<Value>[], options?: QueryExecutorOptions,): Promise<Value[]>
	public async mutate<Values extends Record<string, any>>(mutations: { [K in keyof Values]: ContentMutation<Values[K]> | ContentQuery<Values[K]> }, options?: QueryExecutorOptions): Promise<Values>
	public async mutate(input: Record<string, ContentMutation<any> | ContentQuery<any>> | ContentMutation<any> | ContentMutation<any>[], options?: QueryExecutorOptions): Promise<any> {
		const operationSet = createMutationOperationSet(input)

		const printer = new GraphQlQueryPrinter()
		const { query, variables } = printer.printDocument('mutation', operationSet.selection, mutationFragments)
		const result = await this.executor(query, { variables, ...options })

		return operationSet.parse(result)
	}
}
