import { mutationFragments } from './utils/mutationFragments'
import { GraphQlClient, GraphQlClientRequestOptions } from '@contember/graphql-client'
import { GraphQlQueryPrinter } from '@contember/graphql-builder'
import { ContentMutation, ContentQuery } from './nodes'
import { createMutationOperationSet } from './utils/createMutationOperationSet'
import { createQueryOperationSet } from './utils/createQueryOperationSet'
import { MutationError, ValidationResult } from './types'
import { MutationFailedError } from './MutationFailedError'


export type QueryExecutorOptions =
	& GraphQlClientRequestOptions

export class ContentClient {
	constructor(
		private readonly client: Pick<GraphQlClient, 'execute'>,
	) {
	}


	public async query<Value>(query: ContentQuery<Value>, options?: QueryExecutorOptions): Promise<Value>
	public async query<Values extends Record<string, any>>(queries: {[K in keyof Values]: ContentQuery<Values[K]>}, options?: QueryExecutorOptions): Promise<Values>
	public async query(queries: Record<string, ContentQuery<any>> | ContentQuery<any>, options?: QueryExecutorOptions): Promise<any> {
		const printer = new GraphQlQueryPrinter()
		const operationSet = createQueryOperationSet(queries)
		const { query, variables } = printer.printDocument('query', operationSet.selection, {})
		const result = await this.client.execute(query, { variables, ...options })
		return operationSet.parse(result)
	}

	public async mutate<Value>(mutation: ContentMutation<Value>, options?: QueryExecutorOptions,): Promise<Value>
	public async mutate<Value>(mutations: ContentMutation<Value>[], options?: QueryExecutorOptions,): Promise<Value[]>
	public async mutate<Values extends Record<string, any>>(mutations: { [K in keyof Values]: ContentMutation<Values[K]> | ContentQuery<Values[K]> }, options?: QueryExecutorOptions): Promise<Values>
	public async mutate(input: Record<string, ContentMutation<any> | ContentQuery<any>> | ContentMutation<any> | ContentMutation<any>[], options?: QueryExecutorOptions): Promise<any> {
		const operationSet = createMutationOperationSet(input)

		const printer = new GraphQlQueryPrinter()
		const { query, variables } = printer.printDocument('mutation', operationSet.selection, mutationFragments)
		const result = await this.client.execute(query, { variables, ...options })

		return operationSet.parse(result)
	}


	public async mutateOrThrow<Value extends {
		readonly ok: boolean
		readonly errorMessage: string | null
		readonly errors: MutationError[]
		readonly validation: ValidationResult
	}>(mutation: ContentMutation<Value>, options?: QueryExecutorOptions): Promise<Value & { readonly ok: true; readonly errorMessage: null }> {
		const result = await this.mutate(mutation, options)
		if (!result.ok) {
			throw new MutationFailedError(
				result.errorMessage ?? 'Unknown error',
				mutation as ContentMutation<Value & { readonly ok: false; readonly errorMessage: string }>,
				result as Value & { readonly ok: false; readonly errorMessage: string },
			)
		}
		return result as Value & { readonly ok: true; readonly errorMessage: null }
	}
}
