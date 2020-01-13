import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { SugaredRelativeSingleField } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

export const useOptionalDesugaredRelativeSingleField = (
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
) => {
	const environment = useEnvironment()
	return React.useMemo(
		() =>
			sugaredRelativeSingleField
				? QueryLanguage.desugarRelativeSingleField(sugaredRelativeSingleField, environment)
				: undefined,
		[environment, sugaredRelativeSingleField],
	)
}
