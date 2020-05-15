import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { RelativeSingleEntity, SugaredRelativeSingleEntity } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

function useDesugaredRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity,
): RelativeSingleEntity
function useDesugaredRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): RelativeSingleEntity | undefined
function useDesugaredRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): RelativeSingleEntity | undefined {
	const environment = useEnvironment()
	return React.useMemo(
		() =>
			sugaredRelativeSingleEntity !== undefined
				? QueryLanguage.desugarRelativeSingleEntity(sugaredRelativeSingleEntity, environment)
				: sugaredRelativeSingleEntity,
		[environment, sugaredRelativeSingleEntity],
	)
}

export { useDesugaredRelativeSingleEntity }
