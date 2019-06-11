import { CrudQueryBuilder } from 'cms-client'
import { assertNever, ucfirst } from 'cms-common'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	EntityFields,
	EntityListTreeConstraints,
	FieldMarker,
	Marker,
	MarkerTreeRoot,
	ReferenceMarker,
	SingleEntityTreeConstraints
} from '../dao'

type BaseQueryBuilder = CrudQueryBuilder.OmitMethods<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Mutations>

type ReadQueryBuilder = CrudQueryBuilder.ReadQueryBuilder.Builder<never>

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
				this.registerQueryPart(subTree.fields, CrudQueryBuilder.ReadQueryBuilder.create())
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
		subTree: MarkerTreeRoot<SingleEntityTreeConstraints>
	): BaseQueryBuilder {
		const boundedQueryBuilder = new CrudQueryBuilder.UnboundedGetQueryBuilder().by(subTree.constraints.where)
		const [populatedBaseQueryBuilder, populatedListQueryBuilder] = this.addMarkerTreeRootQueries(
			baseQueryBuilder,
			this.registerQueryPart(
				subTree.fields,
				CrudQueryBuilder.ReadQueryBuilder.create(boundedQueryBuilder.objectBuilder)
			)
		)

		return populatedBaseQueryBuilder.get(
			`get${subTree.entityName}`,
			CrudQueryBuilder.ReadQueryBuilder.create(
				populatedListQueryBuilder ? populatedListQueryBuilder.objectBuilder : undefined
			),
			subTree.id
		)
	}

	private addListQuery(
		baseQueryBuilder: BaseQueryBuilder,
		subTree: MarkerTreeRoot<EntityListTreeConstraints>
	): BaseQueryBuilder {
		const readQueryBuilder: CrudQueryBuilder.ReadQueryBuilder.Builder<
			Exclude<CrudQueryBuilder.SupportedArguments, 'filter'>
		> =
			subTree.constraints && subTree.constraints.filter
				? CrudQueryBuilder.ReadQueryBuilder.create().filter(subTree.constraints.filter)
				: CrudQueryBuilder.ReadQueryBuilder.create()

		const [newBaseQueryBuilder, newReadQueryBuilder] = this.addMarkerTreeRootQueries(
			baseQueryBuilder,
			this.registerQueryPart(subTree.fields, readQueryBuilder)
		)

		// This naming convention is unfortunate & temporary
		return newBaseQueryBuilder.list(
			`list${subTree.entityName}`,
			newReadQueryBuilder || CrudQueryBuilder.ReadQueryBuilder.create(),
			subTree.id
		)
	}

	private *registerQueryPart(
		fields: EntityFields,
		builder: ReadQueryBuilder
	): IterableIterator<MarkerTreeRoot | ReadQueryBuilder> {
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

					let builderWithBody = CrudQueryBuilder.ReadQueryBuilder.create()
					for (const item of this.registerQueryPart(reference.fields, builderWithBody)) {
						if (item instanceof CrudQueryBuilder.ReadQueryBuilder) {
							// This branch will only get executed at most once per recursive call
							builderWithBody = CrudQueryBuilder.ReadQueryBuilder.create(item.objectBuilder)
						} else {
							yield item
						}
					}

					const filteredBuilder: CrudQueryBuilder.ReadQueryBuilder.Builder<
						Exclude<CrudQueryBuilder.SupportedArguments, 'filter'>
					> = reference.filter ? builderWithBody.filter(reference.filter) : builderWithBody

					if (reference.reducedBy) {
						// Assuming there's exactly one reducer field as enforced by MarkerTreeGenerator
						const relationField = `${fieldValue.fieldName}By${ucfirst(Object.keys(reference.reducedBy)[0])}`
						builder = builder.reductionRelation(
							relationField,
							filteredBuilder.by(reference.reducedBy),
							referenceName === relationField ? undefined : referenceName
						)
					} else {
						builder = builder.anyRelation(
							fieldValue.fieldName,
							filteredBuilder,
							referenceName === fieldValue.fieldName ? undefined : referenceName
						)
					}
				}
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
		subTrees: IterableIterator<MarkerTreeRoot | ReadQueryBuilder>
	): [BaseQueryBuilder, ReadQueryBuilder | undefined] {
		let listQueryBuilder: ReadQueryBuilder | undefined = undefined

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
