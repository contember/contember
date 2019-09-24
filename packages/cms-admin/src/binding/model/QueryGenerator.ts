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

	private *registerQueryPart(fields: EntityFields, builder: ReadBuilder): Generator<MarkerTreeRoot, ReadBuilder> {
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
					const subPart = this.registerQueryPart(reference.fields, builderWithBody)

					let item = subPart.next()

					while (!item.done) {
						yield item.value
						item = subPart.next()
					}
					builderWithBody = CrudQueryBuilder.ReadBuilder.instantiate(item.value.objectBuilder)

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

		return builder
	}

	private addMarkerTreeRootQueries(
		baseQueryBuilder: BaseQueryBuilder,
		subTrees: Generator<MarkerTreeRoot, ReadBuilder>,
	): [BaseQueryBuilder, ReadBuilder | undefined] {
		let item = subTrees.next()
		while (!item.done) {
			baseQueryBuilder = this.addSubQuery(item.value, baseQueryBuilder)
			item = subTrees.next()
		}

		return [baseQueryBuilder, item.value]
	}
}
