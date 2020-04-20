import { FieldAccessor } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { NormalizedBlockCommonProps, NormalizedBlocks } from './Block'

export const getDiscriminatedBlock = (
	blocks: NormalizedBlocks,
	field: FieldAccessor,
): NormalizedBlockCommonProps | undefined => {
	if (blocks.discriminationKind === 'literal') {
		if (field.currentValue instanceof GraphQlBuilder.Literal) {
			return blocks.blocks.get(field.currentValue.value)
		} else if (typeof field.currentValue === 'string') {
			return blocks.blocks.get(field.currentValue)
		}
	} else {
		if (!(field.currentValue instanceof GraphQlBuilder.Literal)) {
			return blocks.blocks.get(field.currentValue)
		}
	}
	return undefined
}
