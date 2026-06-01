import { useContext } from 'react'
import { EntityKeyContext } from './EntityKeyContext.js'

export const useHasEntity = (): boolean => {
	return useContext(EntityKeyContext) !== undefined
}
