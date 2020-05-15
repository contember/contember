import * as React from 'react'
import { EntityListAccessor } from '../accessors'
import { SugaredRelativeEntityList } from '../treeParameters'
import { useDesugaredRelativeEntityList } from './useDesugaredRelativeEntityList'
import { useEntityAccessor } from '../accessorPropagation'

function useRelativeEntityList(sugaredRelativeEntityList: string | SugaredRelativeEntityList): EntityListAccessor
function useRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): EntityListAccessor | undefined
function useRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): EntityListAccessor | undefined {
	const entity = useEntityAccessor()
	const relativeEntityList = useDesugaredRelativeEntityList(sugaredRelativeEntityList)
	return React.useMemo(
		() => (relativeEntityList ? entity.getRelativeEntityList(relativeEntityList) : relativeEntityList),
		[entity, relativeEntityList],
	)
}

export { useRelativeEntityList }
