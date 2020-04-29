import { FieldAccessor } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { NormalizedDiscriminatedData } from './NormalizedDiscriminatedData'
import { ResolvedDiscriminatedData } from './ResolvedDiscriminatedData'

export const getDiscriminatedDatum = <LiteralBased, ScalarBased>(
	blocks: NormalizedDiscriminatedData<LiteralBased, ScalarBased>,
	discriminant: FieldAccessor,
): ResolvedDiscriminatedData<LiteralBased> | ResolvedDiscriminatedData<ScalarBased> | undefined => {
	if (blocks.discriminationKind === 'literal') {
		if (discriminant.currentValue instanceof GraphQlBuilder.Literal) {
			return blocks.data.get(discriminant.currentValue.value)
		} else if (typeof discriminant.currentValue === 'string') {
			return blocks.data.get(discriminant.currentValue)
		}
	} else {
		if (!(discriminant.currentValue instanceof GraphQlBuilder.Literal)) {
			return blocks.data.get(discriminant.currentValue)
		}
	}
	return undefined
}
