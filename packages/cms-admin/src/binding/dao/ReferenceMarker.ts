import { Input } from '@contember/schema'
import { assertNever } from '@contember/utils'
import { GraphQlBuilder } from '@contember/client'
import { ExpectedCount, FieldName, Filter } from '../bindingTypes'
import { PlaceholderGenerator } from './PlaceholderGenerator'
import { DataBindingError } from './DataBindingError'
import { EntityFields } from './EntityFields'

class ReferenceMarker {
	public readonly fieldName: FieldName
	public readonly references: ReferenceMarker.References

	public static readonly defaultReferencePreferences: {
		readonly [index in ExpectedCount]: ReferenceMarker.ReferencePreferences
	} = {
		[ExpectedCount.UpToOne]: {
			initialEntityCount: 1,
		},
		[ExpectedCount.PossiblyMany]: {
			initialEntityCount: 1,
		},
	}

	public constructor(
		fieldName: FieldName,
		expectedCount: ExpectedCount,
		fields: EntityFields,
		filter?: Filter<GraphQlBuilder.Literal>,
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	)
	public constructor(fieldName: FieldName, references: ReferenceMarker.References)
	public constructor(
		fieldName: FieldName,
		decider: ExpectedCount | ReferenceMarker.References,
		fields?: EntityFields,
		filter?: Filter<GraphQlBuilder.Literal>,
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	) {
		let references: ReferenceMarker.References

		if (typeof decider === 'object') {
			references = decider
		} else if (decider === ExpectedCount.UpToOne || decider === ExpectedCount.PossiblyMany) {
			const constraints: ReferenceMarker.ReferenceConstraints = {
				expectedCount: decider,
				filter,
				reducedBy,
			}
			const placeholderName = PlaceholderGenerator.getReferencePlaceholder(fieldName, constraints)
			const normalizedPreferences: ReferenceMarker.ReferencePreferences = {
				...ReferenceMarker.defaultReferencePreferences[decider],
				...preferences,
			}
			if (normalizedPreferences.initialEntityCount < 0 || !Number.isInteger(normalizedPreferences.initialEntityCount)) {
				throw new DataBindingError(`The preferred 'initialEntityCount' for a relation must be a non-negative integer!`)
			}
			if (decider === ExpectedCount.UpToOne && normalizedPreferences.initialEntityCount > 1) {
				throw new DataBindingError(`A ToOne reference cannot prefer more than one entity!`)
			}

			references = {
				[placeholderName]: Object.assign(constraints, {
					placeholderName,
					fields: fields || {},
					preferences: normalizedPreferences,
				}),
			}
		} else {
			throw assertNever(decider)
		}

		for (const placeholderName in references) {
			const reference = references[placeholderName]
			if (reference.reducedBy) {
				const fields = Object.keys(reference.reducedBy)

				if (fields.length !== 1) {
					// TODO this will change in future
					throw new DataBindingError(`A hasMany relation can only be reduced to a hasOne by exactly one field.`)
				}
			}
		}

		this.fieldName = fieldName
		this.references = references
	}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateReferenceMarkerPlaceholder(this)
	}
}

namespace ReferenceMarker {
	export interface ReferenceConstraints {
		expectedCount: ExpectedCount
		filter?: Input.Where<Input.Condition<Input.ColumnValue<GraphQlBuilder.Literal>>>
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
	}

	export interface ReferencePreferences {
		readonly initialEntityCount: number
	}

	export interface Reference extends ReferenceConstraints {
		fields: EntityFields
		preferences: ReferencePreferences
		placeholderName: string
	}

	export interface References {
		[alias: string]: Reference
	}
}

export { ReferenceMarker }
