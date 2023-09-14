import { useMemo } from 'react'
import { QueryLanguage } from '@contember/binding'
import type { RelativeSingleField, SugaredRelativeSingleField } from '@contember/binding'
import { useEnvironment } from './useEnvironment'

/**
 * @deprecated Use useField instead.
 */
function useDesugaredRelativeSingleField(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField,
): RelativeSingleField
/**
 * @deprecated Use useField instead.
 */
function useDesugaredRelativeSingleField(
	sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined,
): RelativeSingleField | undefined
/**
 * @deprecated Use useField instead.
 */
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

	return useMemo(
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
