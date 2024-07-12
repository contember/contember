import { useEntity } from '@contember/react-binding'
import { useBlockRepeaterConfig } from '../contexts'

export const useBlockRepeaterCurrentBlock = () => {
	const entity = useEntity()
	const { discriminatedBy, blocks } = useBlockRepeaterConfig()
	const field = entity.getField<string>(discriminatedBy).value
	return field ? blocks[field] : undefined
}
