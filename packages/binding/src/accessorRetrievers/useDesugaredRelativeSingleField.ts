import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { RelativeSingleField, SugaredRelativeSingleField } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

function useDesugaredRelativeSingleField(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField,
): RelativeSingleField
function useDesugaredRelativeSingleField(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): RelativeSingleField | undefined
function useDesugaredRelativeSingleField(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): RelativeSingleField | undefined {
	const environment = useEnvironment()
	return React.useMemo(
		() =>
			sugaredRelativeSingleField !== undefined
				? QueryLanguage.desugarRelativeSingleField(sugaredRelativeSingleField, environment)
				: sugaredRelativeSingleField,
		[environment, sugaredRelativeSingleField],
	)
}

export { useDesugaredRelativeSingleField }
