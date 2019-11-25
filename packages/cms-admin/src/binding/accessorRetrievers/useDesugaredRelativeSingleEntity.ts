import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export const useDesugaredRelativeSingleEntity = (sugaredRelativeSingleEntity: SugaredRelativeSingleEntity) => {
	const environment = useEnvironment()
	return React.useMemo(() => QueryLanguage.parseRelativeSingleEntity(sugaredRelativeSingleEntity, environment), [
		environment,
		sugaredRelativeSingleEntity,
	])
}
