import { useConstantValueInvariant } from '@contember/react-utils'
import { useMemo } from 'react'
import type { Alias, SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList } from '@contember/binding'

export function useEntityListSubTreeParameters(alias: Alias): Alias
export function useEntityListSubTreeParameters(
	qualifiedEntityList: SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
): SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList
export function useEntityListSubTreeParameters(
	qualifiedEntityListOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
): Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList
export function useEntityListSubTreeParameters(
	qualifiedEntityList: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
): Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList {
	useConstantValueInvariant(typeof qualifiedEntityList)

	if (typeof qualifiedEntityList === 'string') {
		return qualifiedEntityList
	}

	// eslint-disable-next-line react-hooks/rules-of-hooks
	useConstantValueInvariant(
		qualifiedEntityList.isCreating,
		`EntityListSubTree: cannot alternate the 'isCreating' value.`,
	)

	// eslint-disable-next-line react-hooks/rules-of-hooks
	useConstantValueInvariant(
		typeof qualifiedEntityList.entities,
		`EntityListSubTree: cannot alternate the 'entities' value.`,
	)

	if (qualifiedEntityList.isCreating) {
		const entities = qualifiedEntityList.entities

		if (typeof entities === 'string') {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			return useMemo(
				() => ({
					isCreating: true,
					entities,
				}),
				[entities],
			)
		}
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useMemo(
			() => ({
				isCreating: true,
				entities: { entityName: entities.entityName },
			}),
			[entities.entityName],
		)
	}
	const entities = qualifiedEntityList.entities

	if (typeof entities === 'string') {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useMemo(
			() => ({
				entities: entities,
				orderBy: qualifiedEntityList.orderBy,
				offset: qualifiedEntityList.offset,
				limit: qualifiedEntityList.limit,
			}),
			[entities, qualifiedEntityList.limit, qualifiedEntityList.offset, qualifiedEntityList.orderBy],
		)
	}
	// eslint-disable-next-line react-hooks/rules-of-hooks
	return useMemo(
		() => ({
			entities: {
				entityName: entities.entityName,
				filter: entities.filter,
			},
			orderBy: qualifiedEntityList.orderBy,
			offset: qualifiedEntityList.offset,
			limit: qualifiedEntityList.limit,
		}),
		[
			entities.entityName,
			entities.filter,
			qualifiedEntityList.limit,
			qualifiedEntityList.offset,
			qualifiedEntityList.orderBy,
		],
	)
}
