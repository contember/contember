import { createRequiredContext } from '@contember/react-utils'
import { EntityAccessor } from '@contember/react-binding'

export const [MultiUploaderEntityToFileStateMapContext, useMultiUploaderEntityToFileStateMap] = createRequiredContext<Map<() => EntityAccessor, string>>('MultiUploaderEntityToFileStateMapContext')
