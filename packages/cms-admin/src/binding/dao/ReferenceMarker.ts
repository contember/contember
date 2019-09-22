import { GraphQlBuilder } from 'cms-client'
import { assertNever } from '@contember/utils'
import { Input } from '@contember/schema'
import { ExpectedCount, FieldName, Filter } from '../bindingTypes'
import { PlaceholderGenerator } from '../model'
import { DataBindingError } from './DataBindingError'
import { EntityFields } from './EntityFields'

class ReferenceMarker {
	public readonly fieldName: FieldName
	public readonly references: ReferenceMarker.References

	private static defaultReferencePreferences: {
		[index in ExpectedCount]: ReferenceMarker.ReferencePreferences
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
		preferences?: ReferenceMarker.ReferencePreferences,
	)
	public constructor(fieldName: FieldName, references: ReferenceMarker.References)
	public constructor(
		fieldName: FieldName,
		decider: ExpectedCount | ReferenceMarker.References,
		fields?: EntityFields,
		filter?: Filter<GraphQlBuilder.Literal>,
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
		preferences?: ReferenceMarker.ReferencePreferences,
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

			references = {
				[placeholderName]: Object.assign(constraints, {
					placeholderName,
					fields: fields || {},
					preferences: { ...ReferenceMarker.defaultReferencePreferences[decider], ...preferences },
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
		initialEntityCount: number
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
