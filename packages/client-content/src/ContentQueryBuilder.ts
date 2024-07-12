import { ContentClientInput, MutationResult, SchemaNames, TransactionResult } from './types'
import { ContentEntitySelection, ContentEntitySelectionCallback, ContentEntitySelectionContext, ContentMutation, ContentOperation, ContentQuery } from './nodes'
import { createListArgs } from './utils/createListArgs'
import { createTypedArgs } from './utils/createTypedArgs'
import { Input } from '@contember/schema'
import { GraphQlField, GraphQlFieldTypedArgs, GraphQlFragmentSpread, GraphQlSelectionSet } from '@contember/graphql-builder'
import { createMutationOperationSet } from './utils/createMutationOperationSet'

export type EntitySelectionOrCallback =
	| ContentEntitySelection
	| ContentEntitySelectionCallback

export type MutationTransactionOptions = {
	deferForeignKeyConstraints?: boolean
	deferUniqueConstraints?: boolean
}

type MutationOperation = 'create' | 'update' | 'delete' | 'upsert' | 'transaction';

export class ContentQueryBuilder {
	constructor(private readonly schema: SchemaNames) {
	}


	public fragment(name: string, fieldsCallback?: ContentEntitySelectionCallback): ContentEntitySelection {
		const context = this.createContext(name)

		const entitySelection = new ContentEntitySelection(context, [])
		if (!fieldsCallback) {
			return entitySelection
		}
		return fieldsCallback(entitySelection)
	}



	public count(name: string, args: Pick<ContentClientInput.AnyListQueryInput, 'filter'>): ContentQuery<number> {
		const context = this.createContext(name)
		const fieldName = `paginate${name}`
		const typedArgs = createTypedArgs(args, {
			filter: `${context.entity.name}Where`,
		})
		const selectionSet: GraphQlSelectionSet = [
			new GraphQlField(null, 'pageInfo', {}, [
				new GraphQlField(null, 'totalCount'),
			]),
		]

		return new ContentOperation('query', fieldName, typedArgs, selectionSet, it => {
			return it.pageInfo.totalCount
		})
	}


	public list(name: string, args: ContentClientInput.AnyListQueryInput, fields: EntitySelectionOrCallback): ContentQuery<any[]> {
		const context = this.createContext(name)
		const fieldName = `list${name}`
		const typedArgs = createListArgs(context.entity, args)
		const selection = this.resolveSelection(fields, context)

		return new ContentOperation('query', fieldName, typedArgs, selection.selectionSet, it => {
			const transformFn = selection.transformFn
			if (transformFn) {
				return it.map((el: any) => transformFn(el, {
					rootValue: it,
				}))
			}
			return it
		})
	}


	public get(name: string, args: Input.UniqueQueryInput, fields: EntitySelectionOrCallback): ContentQuery<Record<string, unknown> | null> {
		const context = this.createContext(name)
		const fieldName = `get${name}`
		const typedArgs = createTypedArgs(args, {
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})
		const selection = this.resolveSelection(fields, context)

		return new ContentOperation('query', fieldName, typedArgs, selection.selectionSet, it => {
			if (it && selection.transformFn) {
				return selection.transformFn(it, {
					rootValue: it,
				})
			}
			return it
		})
	}


	public create(name: string, args: Input.CreateInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const entity = this.getEntity(name)
		const typedArgs = createTypedArgs(args, {
			data: `${entity.name}CreateInput!`,
		})

		return this.createMutationOperation(name, 'create', typedArgs, fields)
	}

	public update(name: string, args: Input.UpdateInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const entity = this.getEntity(name)
		const typedArgs = createTypedArgs(args, {
			data: `${entity.name}UpdateInput!`,
			by: `${entity.name}UniqueWhere!`,
			filter: `${entity.name}Where`,
		})
		return this.createMutationOperation(name, 'update', typedArgs, fields)
	}


	public upsert(name: string, args: Input.UpsertInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const entity = this.getEntity(name)
		const typedArgs = createTypedArgs(args, {
			update: `${entity.name}UpdateInput!`,
			create: `${entity.name}CreateInput!`,
			by: `${entity.name}UniqueWhere!`,
			filter: `${entity.name}Where`,
		})
		return this.createMutationOperation(name, 'upsert', typedArgs, fields)
	}


	public delete(name: string, args: Input.UniqueQueryInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const entity = this.getEntity(name)
		const typedArgs = createTypedArgs(args, {
			by: `${entity.name}UniqueWhere!`,
			filter: `${entity.name}Where`,
		})
		return this.createMutationOperation(name, 'delete', typedArgs, fields)
	}


	private createMutationOperation(name: string, operation: MutationOperation, args: GraphQlFieldTypedArgs, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const context = this.createContext(name)
		const fieldName = `${operation}${name}`
		const nodeSelection = fields ? this.resolveSelection(fields, context) : undefined
		const selectionSet = this.createMutationSelection(operation, nodeSelection?.selectionSet)

		return new ContentOperation('mutation', fieldName, args, selectionSet, it => {
			if (!nodeSelection?.transformFn) {
				return it
			}
			return {
				...it,
				node: it.node ? nodeSelection.transformFn(it.node, {
					rootValue: it.node,
				}) : null,
			}
		})
	}

	public transaction(
		input: Record<string, ContentMutation<any> | ContentQuery<any>> | ContentMutation<any> | ContentMutation<any>[],
		options: MutationTransactionOptions = {},
	): ContentMutation<TransactionResult<any>> {
		const combined = createMutationOperationSet(input)

		const transactionArgs = createTypedArgs({ options }, {
			options: 'MutationTransactionOptions',
		})
		const items = [
			...this.createMutationSelection('transaction'),
			...combined.selection,
		]
		return new ContentOperation<TransactionResult<any>, 'mutation'>('mutation', 'transaction', transactionArgs, items, ({ ok, errorMessage, errors, validation, ...data }) => {
			return {
				ok,
				errorMessage,
				errors,
				validation,
				data: combined.parse(data),
			}
		})
	}

	private createMutationSelection(operation: MutationOperation, selection?: GraphQlSelectionSet): GraphQlSelectionSet {
		const items: GraphQlSelectionSet = [
			new GraphQlField(null, 'ok'),
			new GraphQlField(null, 'errorMessage'),
			new GraphQlField(null, 'errors', {}, [
				new GraphQlFragmentSpread('MutationError'),
			]),
		]
		if (operation !== 'delete') {
			items.push(new GraphQlField(null, 'validation', {}, [
				new GraphQlFragmentSpread('ValidationResult'),
			]))
		}
		if (selection) {
			items.push(new GraphQlField(null, 'node', {}, selection))
		}
		return items
	}


	private resolveSelection(
		fields: EntitySelectionOrCallback,
		context: ContentEntitySelectionContext<string>,
	) {
		return (typeof fields === 'function' ? fields(new ContentEntitySelection(context, [])) : fields)
	}

	private createContext(
		name: string,
	): ContentEntitySelectionContext<string> {
		const entity = this.getEntity(name)
		return {
			entity: entity,
			schema: this.schema,
		}
	}

	private getEntity(name: string) {
		const entity = this.schema.entities[name]
		if (!entity) {
			throw new Error(`Entity ${name} not found`)
		}
		return entity
	}
}
