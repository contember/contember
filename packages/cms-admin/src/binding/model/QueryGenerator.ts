import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import { assertNever, Input } from 'cms-common'
import DataBindingError from '../dao/DataBindingError'
import EntityMarker from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import Marker from '../dao/Marker'
import MarkerTreeRoot, { EntityListTreeConstraints, SingleEntityTreeConstraints } from '../dao/MarkerTreeRoot'

type Mutations = 'create' | 'update' | 'delete'
type QueryBuilder = Pick<CrudQueryBuilder.CrudQueryBuilder, Exclude<keyof CrudQueryBuilder.CrudQueryBuilder, Mutations>>

export default class QueryGenerator {
	constructor(private tree: MarkerTreeRoot) {}

	public getReadQuery(): string {
		return this.addSubQuery(this.tree).getGql()
	}

	private addSubQuery(subTree: MarkerTreeRoot, baseQueryBuilder?: QueryBuilder): QueryBuilder {
		if (!baseQueryBuilder) {
			baseQueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (subTree.constraints.whereType === 'unique') {
			return this.addGetQuery(baseQueryBuilder, subTree as MarkerTreeRoot<SingleEntityTreeConstraints>)
		} else if (subTree.constraints.whereType === 'nonUnique') {
			return this.addListQuery(baseQueryBuilder, subTree as MarkerTreeRoot<EntityListTreeConstraints>)
		}
		return assertNever(subTree.constraints)
	}

	private addGetQuery(
		baseQueryBuilder: QueryBuilder,
		subTree: MarkerTreeRoot<SingleEntityTreeConstraints>,
	): QueryBuilder {
		if (subTree.root.where) {
			throw new DataBindingError(
				'When selecting a single item, it does not make sense for a top-level Entity to have a where clause.',
			)
		}

		const boundedQueryBuilder = new CrudQueryBuilder.UnboundedGetQueryBuilder().where(subTree.constraints.where)
		let listQueryBuilder = new CrudQueryBuilder.ListQueryBuilder(boundedQueryBuilder.objectBuilder)
		;[baseQueryBuilder, listQueryBuilder] = this.addMarkerTreeRootQueries(
			baseQueryBuilder,
			this.registerListQueryPart(subTree.root, listQueryBuilder),
		)

		return baseQueryBuilder.get(subTree.root.entityName, listQueryBuilder, subTree.id)
	}

	private addListQuery(
		baseQueryBuilder: QueryBuilder,
		subTree: MarkerTreeRoot<EntityListTreeConstraints>,
	): QueryBuilder {
		const entityWhere = subTree.root.where
		let listQueryBuilder = new CrudQueryBuilder.ListQueryBuilder()

		if (subTree.constraints.where) {
			if (entityWhere) {
				listQueryBuilder = listQueryBuilder.where({
					and: [entityWhere, subTree.root.where],
				} as Input.Where<GraphQlBuilder.Literal>) // TODO: This cast is necessary for the time being because TS…
			} else {
				listQueryBuilder = listQueryBuilder.where(subTree.constraints.where)
			}
		} else if (entityWhere) {
			listQueryBuilder = listQueryBuilder.where(entityWhere)
		}

		;[baseQueryBuilder, listQueryBuilder] = this.addMarkerTreeRootQueries(
			baseQueryBuilder,
			this.registerListQueryPart(subTree.root, listQueryBuilder),
		)

		// This naming convention is unfortunate & temporary
		return baseQueryBuilder.list(`${subTree.root.entityName}s`, listQueryBuilder, subTree.id)
	}

	private *registerListQueryPart(
		context: EntityMarker,
		builder: CrudQueryBuilder.ListQueryBuilder,
	): IterableIterator<MarkerTreeRoot | CrudQueryBuilder.ListQueryBuilder> {
		builder = builder.column('id')

		for (const field in context.fields) {
			const fieldValue: Marker = context.fields[field]

			if (fieldValue) {
				if (fieldValue instanceof FieldMarker) {
					builder = builder.column(fieldValue.name)
				} else if (fieldValue instanceof EntityMarker) {
					let subBuilder = new CrudQueryBuilder.ListQueryBuilder()

					if (fieldValue.where) {
						subBuilder = subBuilder.where(fieldValue.where)
					}

					for (const item of this.registerListQueryPart(fieldValue, subBuilder)) {
						if (item instanceof CrudQueryBuilder.ListQueryBuilder) {
							// This branch will only get executed at most once per recursive call
							subBuilder = new CrudQueryBuilder.ListQueryBuilder(item.objectBuilder)
						} else {
							yield item
						}
					}

					builder = builder.relation(field, subBuilder)
				} else {
					yield fieldValue
				}
			}
		}

		// Ideally, this would have been a `return`, not a `yield`, and the return type would have been something slightly
		// different. Unfortunately, https://github.com/Microsoft/TypeScript/issues/2983 prevents this but it's not too big
		// of a deal.
		yield builder
	}

	private addMarkerTreeRootQueries(
		baseQueryBuilder: QueryBuilder,
		subTrees: IterableIterator<MarkerTreeRoot | CrudQueryBuilder.ListQueryBuilder>,
	): [QueryBuilder, CrudQueryBuilder.ListQueryBuilder] {
		let listQueryBuilder: CrudQueryBuilder.ListQueryBuilder | undefined = undefined

		for (const item of subTrees) {
			if (item instanceof MarkerTreeRoot) {
				baseQueryBuilder = this.addSubQuery(item, baseQueryBuilder)
			} else {
				listQueryBuilder = item
			}
		}

		return [baseQueryBuilder, listQueryBuilder || new CrudQueryBuilder.ListQueryBuilder()]
	}
}
