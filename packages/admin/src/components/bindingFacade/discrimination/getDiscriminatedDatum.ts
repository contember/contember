import { FieldAccessor, FieldValue } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { NormalizedDiscriminatedData } from './NormalizedDiscriminatedData'
import { ResolvedDiscriminatedData } from './ResolvedDiscriminatedData'

export const getDiscriminatedDatum = <LiteralBased, ScalarBased>(
	blocks: NormalizedDiscriminatedData<LiteralBased, ScalarBased>,
	discriminant: FieldAccessor | FieldValue,
): ResolvedDiscriminatedData<LiteralBased> | ResolvedDiscriminatedData<ScalarBased> | undefined => {
	const discriminantValue: FieldValue = discriminant instanceof FieldAccessor ? discriminant.currentValue : discriminant

	if (blocks.discriminationKind === 'literal') {
		if (discriminantValue instanceof GraphQlBuilder.Literal) {
			return blocks.data.get(discriminantValue.value)
		} else if (typeof discriminantValue === 'string') {
			return blocks.data.get(discriminantValue)
		}
	} else {
		if (!(discriminantValue instanceof GraphQlBuilder.Literal)) {
			return blocks.data.get(discriminantValue)
		}
	}
	return undefined
}
