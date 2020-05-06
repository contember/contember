import * as React from 'react'
import { EntityListAccessor } from '../accessors'
import { SugaredRelativeEntityList } from '../treeParameters'
import { useEntityAccessor } from '../accessorPropagation'
import { useOptionalDesugaredRelativeEntityList } from './useOptionalDesugaredRelativeEntityList'

export const useOptionalRelativeEntityList = (
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): EntityListAccessor | undefined => {
	const entity = useEntityAccessor()
	const relativeEntityList = useOptionalDesugaredRelativeEntityList(sugaredRelativeEntityList)
	return React.useMemo(() => (relativeEntityList ? entity.getRelativeEntityList(relativeEntityList) : undefined), [
		entity,
		relativeEntityList,
	])
}
