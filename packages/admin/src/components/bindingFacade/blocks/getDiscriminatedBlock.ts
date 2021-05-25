import type { FieldAccessor, FieldValue } from '@contember/binding'
import { getDiscriminatedDatum } from '../discrimination'
import type { NormalizedBlocks } from './useNormalizedBlocks'

export const getDiscriminatedBlock = (blocks: NormalizedBlocks, field: FieldAccessor | FieldValue) =>
	getDiscriminatedDatum(blocks, field)
