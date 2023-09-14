import { useMemo } from 'react'
import { QueryLanguage } from '@contember/binding'
import type { RelativeEntityList, SugaredRelativeEntityList } from '@contember/binding'
import { useEnvironment } from './useEnvironment'

/**
 * @deprecated Use useEntityList instead.
 */
function useDesugaredRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList,
): RelativeEntityList
/**
 * @deprecated Use useEntityList instead.
 */
function useDesugaredRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): RelativeEntityList | undefined
/**
 * @deprecated Use useEntityList instead.
 */
function useDesugaredRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): RelativeEntityList | undefined {
	const environment = useEnvironment()

	let normalizedSugared: SugaredRelativeEntityList | undefined = undefined
	let hasList: boolean

	if (sugaredRelativeEntityList === undefined) {
		hasList = false
	} else if (typeof sugaredRelativeEntityList === 'string') {
		hasList = true
		normalizedSugared = {
			field: sugaredRelativeEntityList,
		}
	} else {
		hasList = true
		normalizedSugared = sugaredRelativeEntityList
	}

	return useMemo(
		() =>
			hasList
				? QueryLanguage.desugarRelativeEntityList(
						{
							field: normalizedSugared!.field,
							setOnCreate: normalizedSugared?.setOnCreate,
							isNonbearing: normalizedSugared?.isNonbearing,
							offset: normalizedSugared?.offset,
							limit: normalizedSugared?.limit,
							orderBy: normalizedSugared?.orderBy,
						},
						environment,
				  )
				: undefined,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			normalizedSugared?.field,
			normalizedSugared?.setOnCreate,
			normalizedSugared?.isNonbearing,
			normalizedSugared?.offset,
			normalizedSugared?.limit,
			normalizedSugared?.orderBy,
			hasList,
			environment,
		],
	)
}

export { useDesugaredRelativeEntityList }
