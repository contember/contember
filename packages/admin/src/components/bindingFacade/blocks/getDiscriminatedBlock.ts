import { FieldAccessor, FieldValue } from '@contember/binding'
import { getDiscriminatedDatum } from '../discrimination'
import { NormalizedBlocks } from './useNormalizedBlocks'

export const getDiscriminatedBlock = (blocks: NormalizedBlocks, field: FieldAccessor | FieldValue) =>
	getDiscriminatedDatum(blocks, field)
