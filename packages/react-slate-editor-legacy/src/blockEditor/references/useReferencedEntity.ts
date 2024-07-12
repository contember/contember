import { GetReferencedEntity } from './useGetReferencedEntity'
import { useContext } from 'react'
import { ReferencesContext } from './ReferencesProvider'

export const useReferencedEntity: GetReferencedEntity = (path, el) => {
	const ctx = useContext(ReferencesContext)
	return ctx(path, el)
}
