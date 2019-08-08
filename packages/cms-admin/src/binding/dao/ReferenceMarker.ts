import { GraphQlBuilder } from 'cms-client'
import { assertNever, Input } from 'cms-common'
import { FieldName, Filter } from '../bindingTypes'
import { PlaceholderGenerator } from '../model'
import { EntityFields } from './EntityFields'

class ReferenceMarker {
	public readonly fieldName: FieldName
	public readonly references: ReferenceMarker.References

	public constructor(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ExpectedCount,
		fields: EntityFields,
		filter?: Filter<GraphQlBuilder.Literal>,
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
	)
	public constructor(fieldName: FieldName, references: ReferenceMarker.References)
	public constructor(
		fieldName: FieldName,
		decider: ReferenceMarker.ExpectedCount | ReferenceMarker.References,
		fields?: EntityFields,
		filter?: Filter<GraphQlBuilder.Literal>,
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
	) {
		let references: ReferenceMarker.References

		if (typeof decider === 'object') {
			references = decider
		} else if (
			decider === ReferenceMarker.ExpectedCount.UpToOne ||
			decider === ReferenceMarker.ExpectedCount.PossiblyMany
		) {
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
				}),
			}
		} else {
			throw assertNever(decider)
		}

		this.fieldName = fieldName
		this.references = references
	}

	public get placeholderName(): string {
		return PlaceholderGenerator.generateReferenceMarkerPlaceholder(this)
	}
}

namespace ReferenceMarker {
	export enum ExpectedCount {
		UpToOne = 'UpToOne',
		PossiblyMany = 'PossiblyMany',
	}

	export interface ReferenceConstraints {
		expectedCount: ReferenceMarker.ExpectedCount
		filter?: Input.Where<Input.Condition<Input.ColumnValue<GraphQlBuilder.Literal>>>
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
	}

	export interface Reference extends ReferenceConstraints {
		fields: EntityFields
		placeholderName: string
	}

	export interface References {
		[alias: string]: Reference
	}
}

export { ReferenceMarker }
