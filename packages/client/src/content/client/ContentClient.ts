import { ContentMutation, ContentQuery } from './nodes'
import { mutationFragments } from './utils/mutationFragments'
import { MutationResult, TransactionResult } from './types'
import { GraphQlClientRequestOptions } from '../../graphQlClient'
import { GraphQlField, GraphQlFragmentSpread, GraphQlQueryPrinter, GraphQlSelectionSetItem } from '../../builder'

export type CommonMutationOptions = {
	deferForeignKeyConstraints?: boolean
	deferUniqueConstraints?: boolean
}

export type MutationWithTransactionOptions =
	& CommonMutationOptions
	& {
		transaction?: true
	}

export type MutationWithoutTransactionOptions =
	& CommonMutationOptions
	& {
		transaction: false
	}

export type QueryExecutorOptions = {
	variables?: Record<string, unknown>
	apiToken?: string
	signal?: AbortSignal
	headers?: Record<string, string>
	onResponse?: (response: Response) => void
	onData?: (json: unknown) => void
}


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

		const selectionSet = queries instanceof ContentQuery
				? [new GraphQlField('value', queries.queryFieldName, queries.args, queries.nodeSelection)]
				: Object.entries(queries).map(([alias, query]) => new GraphQlField(alias, query.queryFieldName, query.args, query.nodeSelection))

		const { query, variables } = printer.printDocument('query', selectionSet, {})
		const result = await this.executor(query, { variables, ...options })

		if (queries instanceof ContentQuery) {
			return queries.parse((result as any).value)
		}
		return Object.fromEntries(Object.entries(queries).map(([alias, query]) => [alias, query.parse((result as any)[alias])]))
	}

	public async mutate<Value>(
		mutation: ContentMutation<Value>,
		options: MutationWithoutTransactionOptions & QueryExecutorOptions,
	): Promise<MutationResult<Value>>
	public async mutate<Value>(
		mutation: ContentMutation<Value>,
		options?: MutationWithTransactionOptions & QueryExecutorOptions,
	): Promise<TransactionResult<MutationResult<Value>>>

	public async mutate<Value>(
		mutations: ContentMutation<Value>[],
		options: MutationWithoutTransactionOptions & QueryExecutorOptions,
	): Promise<MutationResult<Value>[]>
	public async mutate<Value>(
		mutations: ContentMutation<Value>[],
		options?: MutationWithTransactionOptions & QueryExecutorOptions
	): Promise<TransactionResult<MutationResult<Value>[]>>

	public async mutate<Input extends Record<string, ContentMutation<any>>>(
		input: Input,
		options: MutationWithoutTransactionOptions & QueryExecutorOptions,
	): Promise<{
		[K in keyof Input]: Input[K] extends ContentMutation<infer Value> ? MutationResult<Value> : never
	}>
	public async mutate<Input extends Record<string, ContentMutation<any>>>(
		input: Input,
		options?: MutationWithTransactionOptions & QueryExecutorOptions
	): Promise<TransactionResult<{
		[K in keyof Input]: Input[K] extends ContentMutation<infer Value> ? MutationResult<Value> : never
	}>>

	public async mutate<Input extends Record<string, ContentMutation<any> | ContentQuery<any>>>(
		input: Input,
		options: MutationWithoutTransactionOptions & QueryExecutorOptions,
	): Promise<{
		[K in keyof Input]: Input[K] extends ContentMutation<infer Value> ? MutationResult<Value> : Input[K] extends ContentQuery<infer Value> ? Value : never
	}>
	public async mutate<Input extends Record<string, ContentMutation<any> | ContentQuery<any>>>(
		input: Input,
		options?: MutationWithTransactionOptions & QueryExecutorOptions
	): Promise<TransactionResult<{
		[K in keyof Input]: Input[K] extends ContentMutation<infer Value> ? MutationResult<Value> : Input[K] extends ContentQuery<infer Value> ? Value : never
	}>>

	public async mutate(input: Record<string, ContentMutation<any> | ContentQuery<any>> | ContentMutation<any> | ContentMutation<any>[], options?: & QueryExecutorOptions & (MutationWithTransactionOptions | MutationWithoutTransactionOptions)): Promise<any> {
		const printer = new GraphQlQueryPrinter()
		const fields: GraphQlField[] = []
		let transaction = options?.transaction ?? true
		if (input instanceof ContentMutation) {
			fields.push(this.createMutationField('mut', input))
		} else if (Array.isArray(input)) {
			let i = 0
			for (const mutation of input) {
				fields.push(this.createMutationField('mut_' + i++, mutation))
			}
		} else {
			for (const [alias, mutation] of Object.entries(input)) {
				if (mutation instanceof ContentQuery) {
					fields.push(new GraphQlField(alias, 'query', {}, [
						new GraphQlField('value', mutation.queryFieldName, mutation.args, mutation.nodeSelection),
					]))
				} else {
					fields.push(this.createMutationField(alias, mutation))
				}
			}
		}

		const selectionSet = transaction ? [new GraphQlField(null, 'transaction', {
			...(options?.deferForeignKeyConstraints ?  { deferForeignKeyConstraints: { graphQlType: 'Boolean', value: options?.deferForeignKeyConstraints } } : {}),
			...(options?.deferUniqueConstraints ?  { deferUniqueConstraints: { graphQlType: 'Boolean', value: options?.deferUniqueConstraints } } : {}),
		}, fields)] : fields

		const { query, variables } = printer.printDocument('mutation', selectionSet, mutationFragments)
		const result = await this.executor(query, { variables, ...options })

		const innerResult = transaction ? (result as any).transaction : result

		let value: any
		if (input instanceof ContentMutation) {
			value = innerResult.mut
		} else if (Array.isArray(input)) {
			value = input.map((_, i) => innerResult['mut_' + i] ?? null)
		} else {
			value = {}
			for (const [alias, mutation] of Object.entries(input)) {
				if (mutation instanceof ContentQuery) {
					value[alias] = mutation.parse(innerResult[alias].value)
				} else {
					value[alias] = innerResult[alias]
				}
			}
		}

		if (transaction) {
			return {
				ok: innerResult.ok,
				errorMessage: innerResult.errorMessage,
				errors: innerResult.errors,
				validation: innerResult.validation,
				data: value,
			}
		} else {
			return value
		}
	}

	private createMutationField(alias: string, mutation: ContentMutation<any>): GraphQlField {
		const items: GraphQlSelectionSetItem[] = [
			new GraphQlField(null, 'ok'),
			new GraphQlField(null, 'errorMessage'),
			new GraphQlField(null, 'errors', {}, [
				new GraphQlFragmentSpread('MutationError'),
			]),
		]
		if (mutation.operation !== 'delete') {
			items.push(new GraphQlField(null, 'validation', {}, [
				new GraphQlFragmentSpread('ValidationResult'),
			]))
		}
		if (mutation.nodeSelection) {
			items.push(new GraphQlField(null, 'node', {}, mutation.nodeSelection))
		}
		return new GraphQlField(alias, mutation.mutationFieldName, mutation.mutationArgs, items)
	}
}
