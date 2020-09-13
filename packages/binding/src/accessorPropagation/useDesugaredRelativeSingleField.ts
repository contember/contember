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

	let normalizedSugared: SugaredRelativeSingleField | undefined = undefined
	let hasField: boolean

	if (sugaredRelativeSingleField === undefined) {
		hasField = false
	} else if (typeof sugaredRelativeSingleField === 'string') {
		hasField = true
		normalizedSugared = {
			field: sugaredRelativeSingleField,
		}
	} else {
		hasField = true
		normalizedSugared = sugaredRelativeSingleField
	}

	return React.useMemo(
		() =>
			hasField
				? QueryLanguage.desugarRelativeSingleField(
						{
							field: normalizedSugared!.field,
							defaultValue: normalizedSugared?.defaultValue,
							isNonbearing: normalizedSugared?.isNonbearing,
						},
						environment,
				  )
				: undefined,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[normalizedSugared?.field, normalizedSugared?.defaultValue, normalizedSugared?.isNonbearing, environment, hasField],
	)
}

export { useDesugaredRelativeSingleField }
