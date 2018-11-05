import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { FieldName } from '../bindingTypes'
import { PlaceholderGenerator } from '../model'
import { EntityFields } from './EntityFields'

class ReferenceMarker {
	public readonly fieldName: FieldName
	public readonly references: ReferenceMarker.References

	public constructor(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ExpectedCount,
		fields: EntityFields,
		where?: Input.Where<GraphQlBuilder.Literal>,
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
	)
	public constructor(fieldName: FieldName, references: ReferenceMarker.References)
	public constructor(
		fieldName: FieldName,
		decider: ReferenceMarker.ExpectedCount | ReferenceMarker.References,
		fields?: EntityFields,
		where?: Input.Where<GraphQlBuilder.Literal>,
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
	) {
		let references: ReferenceMarker.References

		if (typeof decider === 'object') {
			references = decider
		} else {
			const constraints: ReferenceMarker.ReferenceConstraints = {
				expectedCount: decider,
				where,
				reducedBy
			}
			const placeholderName = PlaceholderGenerator.getReferencePlaceholder(fieldName, constraints)
			const reference: ReferenceMarker.Reference = Object.assign(constraints, {
				placeholderName,
				fields: fields || {}
			})

			references = {
				[placeholderName]: reference
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
	export enum ExpectedCount {
		UpToOne,
		PossiblyMany
	}

	export interface ReferenceConstraints {
		expectedCount: ReferenceMarker.ExpectedCount
		where?: Input.Where<GraphQlBuilder.Literal>
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
	}

	export interface Reference extends ReferenceConstraints {
		fields: EntityFields
		placeholderName: string
	}

	export type References = {
		[alias: string]: Reference
	}
}

export { ReferenceMarker }
