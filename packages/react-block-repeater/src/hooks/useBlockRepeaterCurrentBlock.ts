import { useEntity } from '@contember/react-binding'
import { useBlockRepeaterConfig } from '../contexts'
import { BlockProps } from '../components'

/**
 * Returns the current block props (see {@link BlockProps}).
 */
export const useBlockRepeaterCurrentBlock = (): BlockProps | undefined => {
	const entity = useEntity()
	const { discriminatedBy, blocks } = useBlockRepeaterConfig()
	const field = entity.getField<string>(discriminatedBy).value
	return field ? blocks[field] : undefined
}
