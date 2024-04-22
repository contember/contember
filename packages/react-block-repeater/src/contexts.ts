import { SugaredRelativeSingleField } from '@contember/react-binding'
import { createRequiredContext } from '@contember/react-utils'
import { BlocksMap } from './types'

const BlockRepeaterConfigContext_ = createRequiredContext<{
	discriminatedBy: SugaredRelativeSingleField['field']
	blocks: BlocksMap
}>('BlockRepeaterConfigContext')
/** @internal */
export const BlockRepeaterConfigContext = BlockRepeaterConfigContext_[0]
export const useBlockRepeaterConfig = BlockRepeaterConfigContext_[1]
