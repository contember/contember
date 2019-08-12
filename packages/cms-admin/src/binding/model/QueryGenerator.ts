import { CrudQueryBuilder } from 'cms-client'
import { GetQueryArguments } from 'cms-client/dist/src/crudQueryBuilder'
import { ucfirst } from 'cms-common'
import { assertNever } from '@contember/utils'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	ConnectionMarker,
	EntityFields,
	EntityListTreeConstraints,
	FieldMarker,
	Marker,
	MarkerTreeRoot,
	ReferenceMarker,
	SingleEntityTreeConstraints,
} from '../dao'

type BaseQueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Mutations>

type ReadBuilder = CrudQueryBuilder.ReadBuilder.Builder<never>

export class QueryGenerator {
	constructor(private tree: MarkerTreeRoot) {}

	public getReadQuery(): string | undefined {
		try {
			return this.addSubQuery(this.tree).getGql()
		} catch (e) {
			return undefined
		}
	}

	private addSubQuery(subTree: MarkerTreeRoot, baseQueryBuilder?: BaseQueryBuilder): BaseQueryBuilder {
		if (!baseQueryBuilder) {
			baseQueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (subTree.constraints === undefined) {
			const [populatedBaseQueryBuilder] = this.addMarkerTreeRootQueries(
				baseQueryBuilder,
				this.registerQueryPart(subTree.fields, CrudQueryBuilder.ReadBuilder.instantiate()),
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
		baseQueryBuilder: BaseQueryBuilder,
		subTree: MarkerTreeRoot<SingleEntityTreeConstraints>,
	): BaseQueryBuilder {
		const [populatedBaseQueryBuilder, populatedListQueryBuilder] = this.addMarkerTreeRootQueries(
			baseQueryBuilder,
			this.registerQueryPart(
				subTree.fields,
				CrudQueryBuilder.ReadBuilder.instantiate<GetQueryArguments>().by(subTree.constraints.where),
			),
		)

		return populatedBaseQueryBuilder.get(
			subTree.entityName,
			CrudQueryBuilder.ReadBuilder.instantiate(
				populatedListQueryBuilder ? populatedListQueryBuilder.objectBuilder : undefined,
			),
			subTree.id,
		)
	}

	private addListQuery(
		baseQueryBuilder: BaseQueryBuilder,
		subTree: MarkerTreeRoot<EntityListTreeConstraints>,
	): BaseQueryBuilder {
		let finalBuilder: ReadBuilder

		if (subTree.constraints) {
			const withFilter: CrudQueryBuilder.ReadBuilder.Builder<
				Exclude<CrudQueryBuilder.ReadArguments, 'filter'>
			> = subTree.constraints.filter
				? CrudQueryBuilder.ReadBuilder.instantiate().filter(subTree.constraints.filter)
				: CrudQueryBuilder.ReadBuilder.instantiate()

			const withOrderBy: CrudQueryBuilder.ReadBuilder.Builder<
				Exclude<CrudQueryBuilder.ReadArguments, 'filter' | 'orderBy'>
			> = subTree.constraints.orderBy ? withFilter.orderBy(subTree.constraints.orderBy) : withFilter

			const withOffset: CrudQueryBuilder.ReadBuilder.Builder<
				Exclude<CrudQueryBuilder.ReadArguments, 'filter' | 'orderBy' | 'offset'>
			> = subTree.constraints.offset === undefined ? withOrderBy : withOrderBy.offset(subTree.constraints.offset)

			finalBuilder = subTree.constraints.limit === undefined ? withOffset : withOffset.limit(subTree.constraints.limit)
		} else {
			finalBuilder = CrudQueryBuilder.ReadBuilder.instantiate()
		}

		const [newBaseQueryBuilder, newReadBuilder] = this.addMarkerTreeRootQueries(
			baseQueryBuilder,
			this.registerQueryPart(subTree.fields, finalBuilder),
		)

		return newBaseQueryBuilder.list(
			subTree.entityName,
			newReadBuilder || CrudQueryBuilder.ReadBuilder.instantiate(),
			subTree.id,
		)
	}

	private *registerQueryPart(
		fields: EntityFields,
		builder: ReadBuilder,
	): IterableIterator<MarkerTreeRoot | ReadBuilder> {
		builder = builder.column(PRIMARY_KEY_NAME)
		builder = builder.column(TYPENAME_KEY_NAME)

		for (const placeholderName in fields) {
			const fieldValue: Marker = fields[placeholderName]

			if (fieldValue instanceof FieldMarker) {
				if (fieldValue.fieldName !== PRIMARY_KEY_NAME) {
					builder = builder.column(fieldValue.fieldName)
				}
			} else if (fieldValue instanceof ReferenceMarker) {
				for (const referenceName in fieldValue.references) {
					const reference = fieldValue.references[referenceName]

					let builderWithBody = CrudQueryBuilder.ReadBuilder.instantiate()
					for (const item of this.registerQueryPart(reference.fields, builderWithBody)) {
						if (item instanceof CrudQueryBuilder.ReadBuilder) {
							// This branch will only get executed at most once per recursive call
							builderWithBody = CrudQueryBuilder.ReadBuilder.instantiate(item.objectBuilder)
						} else {
							yield item
						}
					}

					const filteredBuilder: CrudQueryBuilder.ReadBuilder.Builder<
						Exclude<CrudQueryBuilder.ReadArguments, 'filter'>
					> = reference.filter ? builderWithBody.filter(reference.filter) : builderWithBody

					if (reference.reducedBy) {
						// Assuming there's exactly one reducer field as enforced by MarkerTreeGenerator
						const relationField = `${fieldValue.fieldName}By${ucfirst(Object.keys(reference.reducedBy)[0])}`
						builder = builder.reductionRelation(
							relationField,
							filteredBuilder.by(reference.reducedBy),
							referenceName === relationField ? undefined : referenceName,
						)
					} else {
						builder = builder.anyRelation(
							fieldValue.fieldName,
							filteredBuilder,
							referenceName === fieldValue.fieldName ? undefined : referenceName,
						)
					}
				}
			} else if (fieldValue instanceof ConnectionMarker) {
				// Do nothing ‒ connections are only relevant to mutations.
			} else {
				yield fieldValue
			}
		}

		// Ideally, this would have been a `return`, not a `yield`, and the return type would have been something slightly
		// different. Unfortunately, https://github.com/Microsoft/TypeScript/issues/2983 prevents this but it's not too big
		// of a deal.
		// UPDATE: waiting for https://github.com/microsoft/TypeScript/pull/30790 to be merged
		yield builder
	}

	private addMarkerTreeRootQueries(
		baseQueryBuilder: BaseQueryBuilder,
		subTrees: IterableIterator<MarkerTreeRoot | ReadBuilder>,
	): [BaseQueryBuilder, ReadBuilder | undefined] {
		let listQueryBuilder: ReadBuilder | undefined = undefined

		for (const item of subTrees) {
			if (item instanceof MarkerTreeRoot) {
				baseQueryBuilder = this.addSubQuery(item, baseQueryBuilder)
			} else {
				listQueryBuilder = item
			}
		}

		return [baseQueryBuilder, listQueryBuilder]
	}
}
