import * as React from 'react'
import { EntityListAccessor } from '../accessors'
import { SugaredRelativeEntityList } from '../treeParameters'
import { getRelativeEntityList } from './getRelativeEntityList'
import { useDesugaredRelativeEntityList } from './useDesugaredRelativeEntityList'
import { useEntityContext } from './useEntityContext'

export const useRelativeEntityList = (
	sugaredRelativeEntityList: string | SugaredRelativeEntityList,
): EntityListAccessor => {
	const entity = useEntityContext()
	const relativeEntityList = useDesugaredRelativeEntityList(sugaredRelativeEntityList)
	return React.useMemo(() => getRelativeEntityList(entity, relativeEntityList), [entity, relativeEntityList])
}
