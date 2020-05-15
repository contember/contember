import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { RelativeEntityList, SugaredRelativeEntityList } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

function useDesugaredRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList,
): RelativeEntityList
function useDesugaredRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): RelativeEntityList | undefined
function useDesugaredRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): RelativeEntityList | undefined {
	const environment = useEnvironment()
	return React.useMemo(
		() =>
			sugaredRelativeEntityList !== undefined
				? QueryLanguage.desugarRelativeEntityList(sugaredRelativeEntityList, environment)
				: sugaredRelativeEntityList,
		[environment, sugaredRelativeEntityList],
	)
}

export { useDesugaredRelativeEntityList }
