import levenshtein from 'js-levenshtein'
import { BindingError } from '../../BindingError'
import {
	EntityFieldMarkersContainer,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '../../markers'
import type { Filter, UniqueWhere } from '../../treeParameters'
import { assertNever } from '../../utils'
import { ErrorLocator, LocalizedBindingError } from '../exceptions'
import type { Schema } from './Schema'
import type { SchemaEntity } from './SchemaEntity'

export class SchemaValidator {
	public static assertTreeValid(schema: Schema, tree: MarkerTreeRoot) {
		const errors = Array.from(tree.subTrees.values(), subTree =>
			Array.from(this.getSubTreeErrors(schema, subTree)),
		).flat()

		if (errors.length) {
			throw new BindingError(
				`Invalid data tree:\n` +
					errors
						.map(error => `\t• ${error.message} (Error at ${ErrorLocator.locateMarkerPath(error.markerPath)})`)
						.join(`\n`),
			)
		}
	}

	private static *getSubTreeErrors(
		schema: Schema,
		subTree: EntitySubTreeMarker | EntityListSubTreeMarker,
	): Generator<LocalizedBindingError, void> {
		const entityName = subTree.entityName
		const entity = schema.store.entities.get(entityName)

		if (entity === undefined) {
			const type = subTree instanceof EntitySubTreeMarker ? 'entity list' : 'entity'
			const alternative = this.recommendAlternative(entityName, schema.store.entities.keys())

			yield new LocalizedBindingError(
				`Invalid ${type} sub tree: Entity '${entityName}' doesn't exist. ${
					alternative ? `Did you mean '${alternative}'?` : ''
				}`,
				[subTree],
			)

			return
		}

		// TODO check filter
		// TODO check where
		// TODO run custom validators

		yield* this.nestErrorsIn(subTree, this.getMarkersContainerErrors(schema, entity, subTree.fields))
	}

	private static *getMarkersContainerErrors(
		schema: Schema,
		containingEntity: SchemaEntity,
		markers: EntityFieldMarkersContainer,
	): Generator<LocalizedBindingError, void> {
		for (const marker of markers.markers.values()) {
			if (marker instanceof FieldMarker) {
				yield* this.getFieldErrors(schema, containingEntity, marker)
			} else if (marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker) {
				yield* this.getRelationErrors(schema, containingEntity, marker)
			} else {
				return assertNever(marker)
			}
		}
	}

	private static *getRelationErrors(
		schema: Schema,
		containingEntity: SchemaEntity,
		marker: HasOneRelationMarker | HasManyRelationMarker,
	): Generator<LocalizedBindingError, void> {
		const relationName = marker.parameters.field
		const relation = containingEntity.fields.get(relationName)
		const type = marker instanceof HasOneRelationMarker ? 'one' : 'many'

		if (relation === undefined) {
			const alternative = this.recommendAlternative(
				relationName,
				Array.from(containingEntity.fields)
					.filter(([, field]) => {
						if (field.__typename !== '_Relation') {
							return false
						}
						if (marker instanceof HasOneRelationMarker) {
							return field.type === 'OneHasOne' || field.type === 'ManyHasOne'
						}
						if (marker instanceof HasManyRelationMarker) {
							return field.type === 'OneHasMany' || field.type === 'ManyHasMany'
						}
						return assertNever(marker)
					})
					.map(([fieldName]) => fieldName),
			)

			yield new LocalizedBindingError(
				`Invalid has-${type} relation '${relationName}' doesn't exist on entity '${containingEntity.name}'. ` +
					(alternative ? `Did you mean '${alternative}'?` : ''),
				[marker],
			)
			return
		}
		if (relation.__typename === '_Column') {
			yield new LocalizedBindingError(
				`Invalid has-${type} relation: the name '${relationName}' on entity '${containingEntity.name}' ` +
					`refers to an ordinary scalar field but is being used as a has-${type} relation.`,
				[marker],
			)
			return
		}
		if (
			marker instanceof HasOneRelationMarker &&
			marker.parameters.reducedBy === undefined &&
			(relation.type === 'OneHasMany' || relation.type === 'ManyHasMany')
		) {
			yield new LocalizedBindingError(
				`Invalid has-one relation: the name '${relationName}' on entity '${containingEntity.name}' ` +
					`refers to a *has-many* relation but is being used as a has-one.`,
				[marker],
			)
			return
		}
		if (
			(marker instanceof HasManyRelationMarker ||
				(marker instanceof HasOneRelationMarker && marker.parameters.reducedBy !== undefined)) &&
			(relation.type === 'OneHasOne' || relation.type === 'ManyHasOne')
		) {
			yield new LocalizedBindingError(
				`Invalid has-many relation: the name '${relationName}' on entity '${containingEntity.name}' ` +
					`refers to a *has-one* relation but is being used as a has-many.`,
				[marker],
			)
			return
		}

		// TODO check filter
		// TODO check reducedBy
		// TODO check expected mutations
		// TODO run custom validators

		const targetEntityName = relation.targetEntity
		const targetEntity = schema.store.entities.get(targetEntityName)

		if (targetEntity === undefined) {
			return // ?!? This really shouldn't ever happen.
		}

		yield* this.nestErrorsIn(marker, this.getMarkersContainerErrors(schema, targetEntity, marker.fields))
	}

	private static *getFieldErrors(
		schema: Schema,
		containingEntity: SchemaEntity,
		marker: FieldMarker,
	): Generator<LocalizedBindingError, void> {
		const fieldName = marker.fieldName
		const field = containingEntity.fields.get(fieldName)

		if (field === undefined) {
			const alternative = this.recommendAlternative(
				fieldName,
				Array.from(containingEntity.fields)
					.filter(([, field]) => field.__typename === '_Column')
					.map(([fieldName]) => fieldName),
			)

			yield new LocalizedBindingError(
				`Field '${fieldName}' doesn't exist on entity '${containingEntity.name}'. ` +
					(alternative ? `Did you mean '${alternative}'?` : ''),
				[marker],
			)
			return
		}
		if (field.__typename === '_Relation') {
			yield new LocalizedBindingError(
				`Invalid field: the name '${fieldName}' on entity '${containingEntity.name}' ` +
					`refers to a has-${
						field.type === 'OneHasOne' || field.type === 'ManyHasOne' ? 'one' : 'many'
					} relation but is being used as a field.`,
				[marker],
			)
			return
		}

		// TODO check that defaultValue matches the type
		// TODO run custom validators
	}

	private static *getUniqueWhereErrors(
		schema: Schema,
		containingEntity: SchemaEntity,
		where: UniqueWhere,
	): Generator<LocalizedBindingError, void> {
		//
	}

	private static *getFilterErrors(
		schema: Schema,
		containingEntity: SchemaEntity,
		filter: Filter,
	): Generator<LocalizedBindingError, void> {
		//
	}

	private static *nestErrorsIn(
		source: HasOneRelationMarker | HasManyRelationMarker | EntityListSubTreeMarker | EntitySubTreeMarker,
		to: Generator<LocalizedBindingError, void>,
	): Generator<LocalizedBindingError, void> {
		for (const error of to) {
			yield error.nestedIn(source)
		}
	}

	private static recommendAlternative(original: string, possibleAlternatives: Iterable<string>): string | undefined {
		let bestAlternative: string | undefined = undefined
		let bestAlternativeDistance = Number.MAX_SAFE_INTEGER

		for (const alternative of possibleAlternatives) {
			const distance = levenshtein(original, alternative)

			if (distance < bestAlternativeDistance) {
				bestAlternative = alternative
				bestAlternativeDistance = distance
			}
		}
		return bestAlternative
	}
}
