import { CrudQueryBuilder } from 'cms-client'
import { assertNever } from 'cms-common'
import EntityFields from '../dao/EntityFields'
import FieldMarker from '../dao/FieldMarker'
import Marker from '../dao/Marker'
import MarkerTreeRoot, { EntityListTreeConstraints, SingleEntityTreeConstraints } from '../dao/MarkerTreeRoot'
import ReferenceMarker from '../dao/ReferenceMarker'

type Mutations = 'create' | 'update' | 'delete'
type QueryBuilder = Pick<CrudQueryBuilder.CrudQueryBuilder, Exclude<keyof CrudQueryBuilder.CrudQueryBuilder, Mutations>>

export default class QueryGenerator {
	constructor(private tree: MarkerTreeRoot) {}

	public getReadQuery(): string | undefined {
		try {
			return this.addSubQuery(this.tree).getGql()
		} catch (e) {
			return undefined
		}
	}

	private addSubQuery(subTree: MarkerTreeRoot, baseQueryBuilder?: QueryBuilder): QueryBuilder {
		if (!baseQueryBuilder) {
			baseQueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (subTree.constraints === undefined) {
			const [populatedBaseQueryBuilder] = this.addMarkerTreeRootQueries(
				baseQueryBuilder,
				this.registerListQueryPart(subTree.fields, new CrudQueryBuilder.ListQueryBuilder())
			)
			return populatedBaseQueryBuilder
		} else if (subTree.constraints.whereType === 'unique') {
			return this.addGetQuery(baseQueryBuilder, subTree as MarkerTreeRoot<SingleEntityTreeConstraints>)
		} else if (subTree.constraints.whereType === 'nonUnique') {
			return this.addListQuery(baseQueryBuilder, subTree as MarkerTreeRoot<EntityListTreeConstraints>)
		}
		return assertNever(subTree.constraints)
	}

	private addGetQuery(
		baseQueryBuilder: QueryBuilder,
		subTree: MarkerTreeRoot<SingleEntityTreeConstraints>
	): QueryBuilder {
		const boundedQueryBuilder = new CrudQueryBuilder.UnboundedGetQueryBuilder().where(subTree.constraints.where)
		const [populatedBaseQueryBuilder, populatedListQueryBuilder] = this.addMarkerTreeRootQueries(
			baseQueryBuilder,
			this.registerListQueryPart(
				subTree.fields,
				new CrudQueryBuilder.ListQueryBuilder(boundedQueryBuilder.objectBuilder)
			)
		)

		return populatedBaseQueryBuilder.get(`get${subTree.entityName}`, populatedListQueryBuilder, subTree.id)
	}

	private addListQuery(
		baseQueryBuilder: QueryBuilder,
		subTree: MarkerTreeRoot<EntityListTreeConstraints>
	): QueryBuilder {
		let listQueryBuilder = new CrudQueryBuilder.ListQueryBuilder()

		if (subTree.constraints && subTree.constraints.where) {
			listQueryBuilder = listQueryBuilder.where(subTree.constraints.where)
		}

		;[baseQueryBuilder, listQueryBuilder] = this.addMarkerTreeRootQueries(
			baseQueryBuilder,
			this.registerListQueryPart(subTree.fields, listQueryBuilder)
		)

		// This naming convention is unfortunate & temporary
		return baseQueryBuilder.list(`list${subTree.entityName}`, listQueryBuilder, subTree.id)
	}

	private *registerListQueryPart(
		fields: EntityFields,
		builder: CrudQueryBuilder.ListQueryBuilder
	): IterableIterator<MarkerTreeRoot | CrudQueryBuilder.ListQueryBuilder> {
		builder = builder.column('id')

		for (const placeholderName in fields) {
			const fieldValue: Marker = fields[placeholderName]

			if (fieldValue instanceof FieldMarker) {
				builder = builder.column(fieldValue.fieldName)
			} else if (fieldValue instanceof ReferenceMarker) {
				let subBuilder = new CrudQueryBuilder.ListQueryBuilder()

				if (fieldValue.where) {
					subBuilder = subBuilder.where(fieldValue.where)
				}

				for (const item of this.registerListQueryPart(fieldValue.fields, subBuilder)) {
					if (item instanceof CrudQueryBuilder.ListQueryBuilder) {
						// This branch will only get executed at most once per recursive call
						subBuilder = new CrudQueryBuilder.ListQueryBuilder(item.objectBuilder)
					} else {
						yield item
					}
				}

				builder = builder.relation(fieldValue.fieldName, subBuilder, placeholderName)
			} else {
				yield fieldValue
			}
		}

		// Ideally, this would have been a `return`, not a `yield`, and the return type would have been something slightly
		// different. Unfortunately, https://github.com/Microsoft/TypeScript/issues/2983 prevents this but it's not too big
		// of a deal.
		yield builder
	}

	private addMarkerTreeRootQueries(
		baseQueryBuilder: QueryBuilder,
		subTrees: IterableIterator<MarkerTreeRoot | CrudQueryBuilder.ListQueryBuilder>
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
