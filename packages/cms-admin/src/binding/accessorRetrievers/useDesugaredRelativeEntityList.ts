import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { SugaredRelativeEntityList } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export const useDesugaredRelativeEntityList = (sugaredRelativeEntityList: SugaredRelativeEntityList) => {
	const environment = useEnvironment()
	return React.useMemo(() => QueryLanguage.parseRelativeEntityList(sugaredRelativeEntityList, environment), [
		environment,
		sugaredRelativeEntityList,
	])
}
