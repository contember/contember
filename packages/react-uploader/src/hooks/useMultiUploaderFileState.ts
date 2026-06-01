import { EntityAccessor } from '@contember/react-binding'
import { useMultiUploaderEntityToFileStateMap } from '../internal/contexts.js'
import { useUploaderState } from '../contexts.js'

export const useMultiUploaderFileState = (entity: EntityAccessor) => {
	const entityToFileIdMap = useMultiUploaderEntityToFileStateMap()
	const fileState = useUploaderState()
	const id = entityToFileIdMap.get(entity.getAccessor)
	if (!id) {
		return undefined
	}
	return fileState.find(it => it.file.id === id)
}
