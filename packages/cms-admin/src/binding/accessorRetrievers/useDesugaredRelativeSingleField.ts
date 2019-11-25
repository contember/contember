import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { SugaredRelativeSingleField } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export const useDesugaredRelativeSingleField = (sugaredRelativeSingleField: SugaredRelativeSingleField) => {
	const environment = useEnvironment()
	return React.useMemo(() => QueryLanguage.parseRelativeSingleField(sugaredRelativeSingleField, environment), [
		environment,
		sugaredRelativeSingleField,
	])
}
