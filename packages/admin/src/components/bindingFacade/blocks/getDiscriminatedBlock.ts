import { FieldAccessor } from '@contember/binding'
import { getDiscriminatedDatum } from '../discrimination'
import { NormalizedBlocks } from './useNormalizedBlocks'

export const getDiscriminatedBlock = (blocks: NormalizedBlocks, field: FieldAccessor) =>
	getDiscriminatedDatum(blocks, field)
