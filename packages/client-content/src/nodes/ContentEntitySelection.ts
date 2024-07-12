import { createListArgs } from '../utils/createListArgs'
import { ContentClientInput, SchemaEntityNames, SchemaNames } from '../types'
import { Input } from '@contember/schema'
import { GraphQlField, GraphQlFieldTypedArgs, GraphQlSelectionSet } from '@contember/graphql-builder'

/**
 * @internal
 */
export type ContentEntitySelectionContext<Name extends string> = {
	entity: SchemaEntityNames<Name>
	schema: SchemaNames
}

export type ContentEntitySelectionCallback = (select: ContentEntitySelection) => ContentEntitySelection

export type EntitySelectionCommonInput<Alias extends string | null = string | null> = { as?: Alias }
export type EntitySelectionManyArgs<Alias extends string | null = string | null> = ContentClientInput.AnyListQueryInput & EntitySelectionCommonInput<Alias>
export type EntitySelectionManyByArgs<Alias extends string | null = string | null> = { by: Input.UniqueWhere; filter?: Input.Where } & EntitySelectionCommonInput<Alias>
export type EntitySelectionOneArgs<Alias extends string | null = string | null> = { filter?: Input.Where } & EntitySelectionCommonInput<Alias>
export type EntitySelectionColumnArgs<Alias extends string | null = string | null> = EntitySelectionCommonInput<Alias>

export type EntitySelectionAnyArgs =
	| EntitySelectionColumnArgs
	| EntitySelectionManyArgs
	| EntitySelectionManyByArgs
	| EntitySelectionOneArgs

export type ContentEntitySelectionOrCallback = ContentEntitySelectionCallback | ContentEntitySelection


export type ContentTransformContext = {
	rootValue: unknown
}

export class ContentEntitySelection {

	/**
	 * @internal
	 */
	constructor(
		/** @internal */
		public readonly context: ContentEntitySelectionContext<string>,
		/** @internal */
		public readonly selectionSet: GraphQlSelectionSet,
		/** @internal */
		public readonly transformFn?: (value: any, ctx: ContentTransformContext) => any,
	) {
	}


	$(field: string, args?: EntitySelectionColumnArgs): ContentEntitySelection
	$(field: string, args: EntitySelectionManyArgs, selection: ContentEntitySelectionOrCallback): ContentEntitySelection
	$(field: string, args: EntitySelectionManyByArgs, selection: ContentEntitySelectionOrCallback): ContentEntitySelection
	$(field: string, args: EntitySelectionOneArgs, selection: ContentEntitySelectionOrCallback): ContentEntitySelection
	$(field: string, selection: ContentEntitySelectionOrCallback): ContentEntitySelection

	$(field: string, argsOrSelection?: EntitySelectionAnyArgs | ContentEntitySelectionOrCallback, selectionIn?: ContentEntitySelectionOrCallback): ContentEntitySelection {
		const [args, selection] = typeof argsOrSelection === 'function' || argsOrSelection instanceof ContentEntitySelection
			? [{}, argsOrSelection]
			: [argsOrSelection ?? {}, selectionIn]
		if (field === '__typename') {
			return this.withField(new GraphQlField(args.as ?? null, '__typename'))
		}
		const fieldInfo = this.context.entity.fields[field]
		if (!fieldInfo) {
			if ('by' in args && field.includes('By')) {
				if (!selection) {
					throw new Error(`Selection is required for ${this.context.entity.name}.${field}.`)
				}
				return this._manyBy(field, args as EntitySelectionManyByArgs, selection)
			}

			throw new Error(`Field ${this.context.entity.name}.${field} does not exist.`)
		}
		if (fieldInfo.type === 'column') {
			return this._column(field, args as EntitySelectionColumnArgs)
		}
		if (fieldInfo.type === 'many') {
			if (!selection) {
				throw new Error(`Selection is required for ${this.context.entity.name}.${field}.`)
			}
			return this._many(field, args as EntitySelectionManyArgs, selection)
		}
		if (fieldInfo.type === 'one') {
			if (!selection) {
				throw new Error(`Selection is required for ${this.context.entity.name}.${field}.`)
			}
			return this._one(field, args as EntitySelectionOneArgs, selection)
		}
		throw new Error(`Unknown field type ${fieldInfo.type}.`)
	}

	$$(): ContentEntitySelection {
		const columns = this.context.entity.scalars
		const nodes = [
			...this.selectionSet,
			...columns.map(col => new GraphQlField(null, col)),
		]
		return new ContentEntitySelection(this.context, nodes)
	}


	transform(transform: (value: any, context: ContentTransformContext) => any): ContentEntitySelection {
		return new ContentEntitySelection(this.context, this.selectionSet, !this.transformFn ? transform : (value, ctx) => {
			return transform(this.transformFn!(value, ctx), ctx)
		})
	}

	private _column(
		name: string,
		args: EntitySelectionCommonInput = {},
	): ContentEntitySelection {
		let fieldInfo = this.context.entity.fields[name]
		if (!fieldInfo) {
			throw new Error(`Field ${this.context.entity.name}.${name} does not exist.`)
		}
		if (fieldInfo?.type !== 'column') {
			throw new Error(`Field ${this.context.entity.name}.${name} is not a column.`)
		}

		const alias = args.as ?? name

		const field = new GraphQlField(alias, name, {})
		return this.withField(field)
	}


	private _many(
		name: string,
		args: EntitySelectionManyArgs,
		fields:
			| ContentEntitySelectionCallback
			| ContentEntitySelection,
	): ContentEntitySelection{
		const alias = args.as ?? name
		const fieldInfo = this.context.entity.fields[name]
		if (!fieldInfo) {
			throw new Error(`Field ${this.context.entity.name}.${name} does not exist.`)
		}
		if (fieldInfo?.type !== 'many') {
			throw new Error(`Field ${this.context.entity.name}.${name} is not a has-many relation.`)
		}
		const entity = this.context.schema.entities[fieldInfo.entity]

		const newContext = {
			entity: entity,
			schema: this.context.schema,
		}

		const entitySelection = typeof fields === 'function' ? fields(new ContentEntitySelection(newContext, [])) : fields
		const newObjectField = new GraphQlField(
			alias,
			name,
			createListArgs(entity, args),
			entitySelection.selectionSet,
		)
		const selectionWithField = this.withField(newObjectField)
		const nestedTransform = entitySelection.transformFn
		if (!nestedTransform) {
			return selectionWithField
		}
		return this.withFieldTransform(alias, it => it.map(nestedTransform))
	}


	private _manyBy(
		name: string,
		args: EntitySelectionManyByArgs,
		fields:
			| ContentEntitySelectionCallback
			| ContentEntitySelection,
	): ContentEntitySelection {
		const alias = args.as ?? name
		const byField = Object.keys(args.by)[0]
		const relationField = name.substring(0, name.length - byField.length - 2)

		const field = this.context.entity.fields[relationField]
		if (!field) {
			throw new Error(`Field ${this.context.entity.name}.${relationField} does not exist.`)
		}
		if (field?.type !== 'many') {
			throw new Error(`Field ${this.context.entity.name}.${relationField} is not a has-many relation.`)
		}
		const entity = this.context.schema.entities[field.entity]
		const newContext = {
			entity: entity,
			schema: this.context.schema,
		}
		const fieldUpperFirst = name.charAt(0).toUpperCase() + name.slice(1)

		const argsWithType: GraphQlFieldTypedArgs = {
			filter: {
				graphQlType: `${entity.name}Where`,
				value: args.filter,
			},
			by: {
				graphQlType: `${this.context.entity.name}${fieldUpperFirst}UniqueWhere!`,
				value: args.by,
			},
		}

		const entitySelection = typeof fields === 'function' ? fields(new ContentEntitySelection(newContext, []) as any) : fields
		const newObjectField = new GraphQlField(
			alias,
			name,
			argsWithType,
			entitySelection.selectionSet,
		)
		const selectionWithField = this.withField(newObjectField)
		const nestedTransform = entitySelection.transformFn
		if (!nestedTransform) {
			return selectionWithField
		}
		return this.withFieldTransform(alias, (it, ctx) => it !== null ? nestedTransform(it, ctx) : null)
	}

	private _one(
		name: string,
		args: EntitySelectionOneArgs,
		fields:
			| ContentEntitySelectionCallback
			| ContentEntitySelection,
	): ContentEntitySelection {
		const alias = args.as ?? name
		const fieldInfo = this.context.entity.fields[name]
		if (!fieldInfo) {
			throw new Error(`Field ${this.context.entity.name}.${name} does not exist.`)
		}
		if (fieldInfo?.type !== 'one') {
			throw new Error(`Field ${this.context.entity.name}.${name} is not a has-one relation.`)
		}
		const entity = this.context.schema.entities[fieldInfo.entity]

		const newContext: ContentEntitySelectionContext<(typeof entity)['name']> = {
			entity: entity,
			schema: this.context.schema,
		}
		const argsWithType: GraphQlFieldTypedArgs = {
			filter: {
				graphQlType: `${entity.name}Where`,
				value: args.filter,
			},
		}
		const entitySelection = typeof fields === 'function'
			? fields(new ContentEntitySelection(newContext, []) as any)
			: fields
		const newObjectField = new GraphQlField(
			alias,
			name,
			argsWithType,
			entitySelection.selectionSet,
		)
		const selectionWithField = this.withField(newObjectField)
		const nestedTransform = entitySelection.transformFn
		if (!nestedTransform) {
			return selectionWithField
		}
		return this.withFieldTransform(alias, (it, ctx) => it !== null ? nestedTransform(it, ctx) : null)
	}


	private withField(field: GraphQlField) {
		return new ContentEntitySelection(this.context, [
			...this.selectionSet,
			field,
		], this.transformFn)
	}

	private withFieldTransform(alias: string, transform: (value: any, ctx: ContentTransformContext) => any) {
		return new ContentEntitySelection(this.context, this.selectionSet, (value, ctx) => {
			const transformedValue = transform(value[alias], ctx)
			const newValue = {
				...value,
				[alias]: transformedValue,
			}
			return this.transformFn ? this.transformFn(newValue, ctx) : newValue
		})
	}
}
