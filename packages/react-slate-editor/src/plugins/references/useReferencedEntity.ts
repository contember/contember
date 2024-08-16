import { GetReferencedEntity } from './useGetReferencedEntity'
import { useEditorGetReferencedEntity } from '../../contexts'

export const useReferencedEntity: GetReferencedEntity = (path, el) => {
	const ctx = useEditorGetReferencedEntity()
	return ctx(path, el)
}
