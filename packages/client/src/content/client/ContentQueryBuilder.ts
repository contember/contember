import { ContentClientInput, SchemaNames } from './types'
import {
	ContentEntitySelection,
	ContentEntitySelectionCallback,
	ContentEntitySelectionContext,
	ContentMutation,
	ContentQuery, createEntitySelection,
} from './nodes'
import { createListArgs } from './utils/createListArgs'
import { createTypedArgs } from './utils/createTypedArgs'
import { Input } from '@contember/schema'
import { GraphQlField, GraphQlSelectionSet } from '../../builder'

export type EntitySelectionOrCallback =
	| ContentEntitySelection
	| ContentEntitySelectionCallback


export class ContentQueryBuilder {
	constructor(private readonly schema: SchemaNames) {
	}


	public fragment(name: string, fieldsCallback?: ContentEntitySelectionCallback): ContentEntitySelection {
		const context = this.createContext(name)

		const entitySelection = createEntitySelection(context, [])
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

		return new ContentQuery(context.entity,  fieldName, typedArgs, selectionSet, it => {
			return it.pageInfo.totalCount
		})
	}


	public list(name: string, args: ContentClientInput.AnyListQueryInput, fields: EntitySelectionOrCallback): ContentQuery<any[]> {
		const context = this.createContext(name)
		const fieldName = `list${name}`
		const typedArgs = createListArgs(context.entity, args)
		const selectionSet = this.resolveSelectionSet(fields, context)

		return new ContentQuery(context.entity,  fieldName, typedArgs, selectionSet)
	}


	public get(name: string, args: Input.UniqueQueryInput, fields: EntitySelectionOrCallback): ContentQuery<Record<string, unknown> | null> {
		const context = this.createContext(name)
		const fieldName = `get${name}`
		const typedArgs = createTypedArgs(args, {
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})
		const selectionSet = this.resolveSelectionSet(fields, context)

		return new ContentQuery(context.entity,  fieldName, typedArgs, selectionSet)
	}


	public create(name: string, args: Input.CreateInput, fields?: EntitySelectionOrCallback): ContentMutation<any> {

		const context = this.createContext(name)
		const fieldName = `create${name}`
		const typedArgs = createTypedArgs(args, {
			data: `${context.entity.name}CreateInput!`,
		})
		const selectionSet = fields ? this.resolveSelectionSet(fields, context) : undefined

		return new ContentMutation(context.entity, 'create', fieldName, typedArgs, selectionSet)
	}


	public update(name: string, args: Input.UpdateInput, fields?: EntitySelectionOrCallback): ContentMutation<any> {

		const context = this.createContext(name)
		const fieldName = `update${name}`
		const typedArgs = createTypedArgs(args, {
			data: `${context.entity.name}UpdateInput!`,
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})
		const selectionSet = fields ? this.resolveSelectionSet(fields, context) : undefined

		return new ContentMutation(context.entity, 'update', fieldName, typedArgs, selectionSet)
	}


	public upsert(name: string, args: Input.UpsertInput, fields?: EntitySelectionOrCallback): ContentMutation<any> {

		const context = this.createContext(name)
		const fieldName = `upsert${name}`
		const typedArgs = createTypedArgs(args, {
			update: `${context.entity.name}UpdateInput!`,
			create: `${context.entity.name}CreateInput!`,
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})
		const selectionSet = fields ? this.resolveSelectionSet(fields, context) : undefined

		return new ContentMutation(context.entity, 'upsert', fieldName, typedArgs, selectionSet)
	}


	public delete(name: string, args: Input.UniqueQueryInput, fields?: EntitySelectionOrCallback): ContentMutation<any> {

		const context = this.createContext(name)
		const typedArgs = createTypedArgs(args, {
			by: `${context.entity.name}UniqueWhere!`,
			filter: `${context.entity.name}Where`,
		})
		const fieldName = `delete${name}`
		const selectionSet = fields ? this.resolveSelectionSet(fields, context) : undefined

		return new ContentMutation(context.entity, 'delete', fieldName, typedArgs, selectionSet)
	}

	private resolveSelectionSet(
		fields: EntitySelectionOrCallback,
		context: ContentEntitySelectionContext<string>,
	) {
		return (typeof fields === 'function' ? fields(createEntitySelection(context, [])) : fields).selectionSet
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
