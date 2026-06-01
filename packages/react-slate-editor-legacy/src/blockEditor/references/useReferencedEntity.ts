import { GetReferencedEntity } from './useGetReferencedEntity.js'
import { useContext } from 'react'
import { ReferencesContext } from './ReferencesProvider.js'

export const useReferencedEntity: GetReferencedEntity = (path, el) => {
	const ctx = useContext(ReferencesContext)
	return ctx(path, el)
}
