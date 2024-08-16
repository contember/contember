import { useContext } from 'react'
import { EntityKeyContext } from './EntityKeyContext'

export const useHasEntity = (): boolean => {
	return useContext(EntityKeyContext) !== undefined
}
