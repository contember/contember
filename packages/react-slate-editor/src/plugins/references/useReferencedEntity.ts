import { GetReferencedEntity } from './useGetReferencedEntity.js'
import { useEditorGetReferencedEntity } from '../../contexts.js'

export const useReferencedEntity: GetReferencedEntity = (path, el) => {
	const ctx = useEditorGetReferencedEntity()
	return ctx(path, el)
}
