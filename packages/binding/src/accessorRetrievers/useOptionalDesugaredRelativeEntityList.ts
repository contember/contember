import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { SugaredRelativeEntityList } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export const useOptionalDesugaredRelativeEntityList = (
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
) => {
	const environment = useEnvironment()
	return React.useMemo(
		() =>
			sugaredRelativeEntityList
				? QueryLanguage.desugarRelativeEntityList(sugaredRelativeEntityList, environment)
				: undefined,
		[environment, sugaredRelativeEntityList],
	)
}
