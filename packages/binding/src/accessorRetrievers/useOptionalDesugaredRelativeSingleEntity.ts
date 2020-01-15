import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export const useOptionalDesugaredRelativeSingleEntity = (
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
) => {
	const environment = useEnvironment()
	return React.useMemo(
		() =>
			sugaredRelativeSingleEntity
				? QueryLanguage.desugarRelativeSingleEntity(sugaredRelativeSingleEntity, environment)
				: undefined,
		[environment, sugaredRelativeSingleEntity],
	)
}
