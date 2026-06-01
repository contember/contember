import type { FieldAccessor, FieldValue } from '@contember/react-binding'
import { getDiscriminatedDatum } from '../discrimination/index.js'
import type { NormalizedBlocks } from './useNormalizedBlocks.js'

export const getDiscriminatedBlock = (blocks: NormalizedBlocks, field: FieldAccessor | FieldValue) => getDiscriminatedDatum(blocks, field)
