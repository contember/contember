import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import { RelativeEntityList, SugaredRelativeEntityList } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

function useDesugaredRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList,
): RelativeEntityList
function useDesugaredRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): RelativeEntityList | undefined
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

	return React.useMemo(
		() =>
			hasList
				? QueryLanguage.desugarRelativeEntityList(
						{
							field: normalizedSugared?.field!,
							setOnCreate: normalizedSugared?.setOnCreate,
							isNonbearing: normalizedSugared?.isNonbearing,
							offset: normalizedSugared?.offset,
							limit: normalizedSugared?.limit,
							orderBy: normalizedSugared?.orderBy,
						},
						environment,
				  )
				: undefined,
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
