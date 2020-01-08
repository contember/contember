import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export const useDesugaredRelativeSingleEntity = (sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity) => {
	const environment = useEnvironment()
	return React.useMemo(() => QueryLanguage.desugarRelativeSingleEntity(sugaredRelativeSingleEntity, environment), [
		environment,
		sugaredRelativeSingleEntity,
	])
}
