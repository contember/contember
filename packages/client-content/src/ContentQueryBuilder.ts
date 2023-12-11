import { ContentClientInput, MutationResult, SchemaNames, TransactionResult } from './types'
import {
	ContentEntitySelection,
	ContentEntitySelectionCallback,
	ContentEntitySelectionContext,
	ContentMutation,
	ContentOperation,
	ContentQuery,
} from './nodes'
import { createListArgs } from './utils/createListArgs'
import { createTypedArgs } from './utils/createTypedArgs'
import { Input } from '@contember/schema'
import { GraphQlField, GraphQlFragmentSpread, GraphQlSelectionSet } from '@contember/graphql-builder'
import { createMutationOperationSet } from './utils/createMutationOperationSet'

export type EntitySelectionOrCallback =
	| ContentEntitySelection
	| ContentEntitySelectionCallback

export type MutationTransactionOptions = {
	deferForeignKeyConstraints?: boolean
	deferUniqueConstraints?: boolean
}

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
		const selectionSet = this.resolveSelectionSet(fields, context)

		return new ContentOperation('query', fieldName, typedArgs, selectionSet)
	}


	public get(name: string, args: Input.UniqueQueryInput, fields: EntitySelectionOrCallback): ContentQuery<Record<string, unknown> | null> {
		const context = this.createContext(name)
		const fieldName = `get${name}`
		const typedArgs = createTypedArgs(args, {
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})
		const selectionSet = this.resolveSelectionSet(fields, context)

		return new ContentOperation('query', fieldName, typedArgs, selectionSet)
	}


	public create(name: string, args: Input.CreateInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const context = this.createContext(name)
		const fieldName = `create${name}`
		const typedArgs = createTypedArgs(args, {
			data: `${context.entity.name}CreateInput!`,
		})
		const selectionSet = this.createMutationSelection('create', fields ? this.resolveSelectionSet(fields, context) : undefined)

		return new ContentOperation('mutation', fieldName, typedArgs, selectionSet)
	}


	public update(name: string, args: Input.UpdateInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const context = this.createContext(name)
		const fieldName = `update${name}`
		const typedArgs = createTypedArgs(args, {
			data: `${context.entity.name}UpdateInput!`,
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})
		const selectionSet = this.createMutationSelection('update', fields ? this.resolveSelectionSet(fields, context) : undefined)

		return new ContentOperation('mutation', fieldName, typedArgs, selectionSet)
	}


	public upsert(name: string, args: Input.UpsertInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const context = this.createContext(name)
		const fieldName = `upsert${name}`
		const typedArgs = createTypedArgs(args, {
			update: `${context.entity.name}UpdateInput!`,
			create: `${context.entity.name}CreateInput!`,
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})

		const selectionSet = this.createMutationSelection('upsert', fields ? this.resolveSelectionSet(fields, context) : undefined)

		return new ContentOperation('mutation', fieldName, typedArgs, selectionSet)
	}


	public delete(name: string, args: Input.UniqueQueryInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult> {

		const context = this.createContext(name)
		const typedArgs = createTypedArgs(args, {
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})
		const fieldName = `delete${name}`
		const selectionSet = this.createMutationSelection('delete', fields ? this.resolveSelectionSet(fields, context) : undefined)

		return new ContentOperation('mutation', fieldName, typedArgs, selectionSet)
	}

	public transaction(
		input: Record<string, ContentMutation<any> | ContentQuery<any>> | ContentMutation<any> | ContentMutation<any>[],
		options: MutationTransactionOptions = {},
	): ContentMutation<TransactionResult<any>> {
		const combined = createMutationOperationSet(input)

		const transactionArgs = createTypedArgs({ options }, {
			options: 'MutationTransactionOptions',
		})
		return new ContentOperation<TransactionResult<any>, 'mutation'>('mutation', 'transaction', transactionArgs, combined.selection, ({ ok, errorMessage, errors, validation, ...data }) => {
			return {
				ok,
				errorMessage,
				errors,
				validation,
				data: combined.parse(data),
			}
		})
	}

	private createMutationSelection(operation: 'create' | 'update' | 'delete' | 'upsert', selection?: GraphQlSelectionSet): GraphQlSelectionSet {
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


	private resolveSelectionSet(
		fields: EntitySelectionOrCallback,
		context: ContentEntitySelectionContext<string>,
	) {
		return (typeof fields === 'function' ? fields(new ContentEntitySelection(context, [])) : fields).selectionSet
	}

	private createContext(
		name: string,
	): ContentEntitySelectionContext<string> {
		const entity = this.schema.entities[name]
		if (!entity) {
			throw new Error(`Entity ${name} not found`)
		}
		return {
			entity: entity,
			schema: this.schema,
		}
	}
}
