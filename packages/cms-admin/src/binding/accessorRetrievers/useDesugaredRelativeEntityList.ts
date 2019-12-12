import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { SugaredRelativeEntityList } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export const useDesugaredRelativeEntityList = (sugaredRelativeEntityList: string | SugaredRelativeEntityList) => {
	const environment = useEnvironment()
	return React.useMemo(() => QueryLanguage.desugarRelativeEntityList(sugaredRelativeEntityList, environment), [
		environment,
		sugaredRelativeEntityList,
	])
}
