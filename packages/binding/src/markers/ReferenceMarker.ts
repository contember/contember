import { BindingError } from '../BindingError'
import { EntityConnections, ExpectedEntityCount, FieldName, Filter, UniqueWhere } from '../treeParameters'
import { assertNever } from '../utils'
import { EntityFieldMarkers, hasAtLeastOneBearingField } from './EntityFieldMarkers'
import { PlaceholderGenerator } from './PlaceholderGenerator'

// TODO unify with EntityListTreeConstraints / SingleEntityTreeConstraints
class ReferenceMarker {
	public readonly fieldName: FieldName
	public readonly references: ReferenceMarker.References
	public readonly placeholderName: string
	public readonly hasAtLeastOneBearingField: boolean

	public static readonly defaultReferencePreferences: {
		readonly [index in ExpectedEntityCount]: ReferenceMarker.ReferencePreferences
	} = {
		[ExpectedEntityCount.UpToOne]: {
			initialEntityCount: 1,
		},
		[ExpectedEntityCount.PossiblyMany]: {
			initialEntityCount: 1,
		},
	}

	public constructor(
		fieldName: FieldName,
		expectedCount: ExpectedEntityCount,
		fields: EntityFieldMarkers,
		filter?: Filter,
		reducedBy?: UniqueWhere,
		isNonbearing?: boolean,
		connections?: EntityConnections,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	)
	public constructor(fieldName: FieldName, references: ReferenceMarker.References)
	public constructor(
		fieldName: FieldName,
		decider: ExpectedEntityCount | ReferenceMarker.References,
		fields?: EntityFieldMarkers,
		filter?: Filter,
		reducedBy?: UniqueWhere,
		isNonbearing?: boolean,
		connections?: EntityConnections,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	) {
		let references: ReferenceMarker.References

		if (typeof decider === 'object') {
			references = decider
		} else if (decider === ExpectedEntityCount.UpToOne || decider === ExpectedEntityCount.PossiblyMany) {
			const constraints: ReferenceMarker.ReferenceConstraints = {
				expectedCount: decider,
				connections,
				filter,
				reducedBy,
			}
			const placeholderName = PlaceholderGenerator.getReferencePlaceholder(fieldName, constraints)
			const normalizedPreferences: ReferenceMarker.ReferencePreferences = {
				...ReferenceMarker.defaultReferencePreferences[decider],
				...preferences,
			}
			if (normalizedPreferences.initialEntityCount < 0 || !Number.isInteger(normalizedPreferences.initialEntityCount)) {
				throw new BindingError(`The preferred 'initialEntityCount' for a relation must be a non-negative integer!`)
			}
			if (decider === ExpectedEntityCount.UpToOne && normalizedPreferences.initialEntityCount > 1) {
				throw new BindingError(`A HasOne reference cannot prefer more than one entity!`)
			}

			references = {
				[placeholderName]: Object.assign(constraints, {
					placeholderName,
					fields: fields || new Map(),
					preferences: normalizedPreferences,
					isNonbearing: isNonbearing ?? false,
					hasAtLeastOneBearingField: fields ? hasAtLeastOneBearingField(fields) : false,
				}),
			}
		} else {
			throw assertNever(decider)
		}

		let hasAtLeastOneBearingReference = false
		for (const placeholderName in references) {
			const reference = references[placeholderName]
			if (reference.reducedBy) {
				const fields = Object.keys(reference.reducedBy)

				if (fields.length !== 1) {
					// TODO this will change in future
					throw new BindingError(`A hasMany relation can only be reduced to a hasOne by exactly one field.`)
				}
			}
			if (reference.hasAtLeastOneBearingField) {
				hasAtLeastOneBearingReference = true
			}
		}

		this.fieldName = fieldName
		this.references = references
		this.hasAtLeastOneBearingField = hasAtLeastOneBearingReference

		this.placeholderName = PlaceholderGenerator.generateReferenceMarkerPlaceholder(this)
	}
}

namespace ReferenceMarker {
	export interface ReferenceConstraints {
		expectedCount: ExpectedEntityCount
		filter?: Filter
		reducedBy?: UniqueWhere
		connections?: EntityConnections
	}

	export interface ReferencePreferences {
		readonly initialEntityCount: number
	}

	export interface Reference extends ReferenceConstraints {
		fields: EntityFieldMarkers
		preferences: ReferencePreferences
		placeholderName: string
		hasAtLeastOneBearingField: boolean
		isNonbearing: boolean
	}

	export interface References {
		[alias: string]: Reference
	}
}

export { ReferenceMarker }
