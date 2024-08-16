import { useConstantValueInvariant } from '@contember/react-utils'
import { useMemo } from 'react'
import type { Alias, SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity } from '@contember/binding'

export function useEntitySubTreeParameters(alias: Alias): Alias
export function useEntitySubTreeParameters(
	qualifiedEntity: SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
): SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity
export function useEntitySubTreeParameters(
	qualifiedSingleEntityOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
): Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity
export function useEntitySubTreeParameters(
	qualifiedSingleEntity: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
): Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity {
	useConstantValueInvariant(typeof qualifiedSingleEntity)

	if (typeof qualifiedSingleEntity === 'string') {
		return qualifiedSingleEntity
	}
	// eslint-disable-next-line react-hooks/rules-of-hooks
	useConstantValueInvariant(qualifiedSingleEntity.isCreating, `EntitySubTree: cannot alternate the 'isCreating' value.`)

	// eslint-disable-next-line react-hooks/rules-of-hooks
	useConstantValueInvariant(typeof qualifiedSingleEntity.entity, `EntitySubTree: cannot alternate the 'entity' value.`)

	if (qualifiedSingleEntity.isCreating) {
		const entity = qualifiedSingleEntity.entity

		if (typeof entity === 'string') {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			return useMemo(
				() => ({
					isCreating: true,
					entity: entity,
				}),
				[entity],
			)
		}
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useMemo(
			() => ({
				isCreating: true,
				entity: { entityName: entity.entityName },
			}),
			[entity.entityName],
		)
	}

	const entity = qualifiedSingleEntity.entity

	if (typeof entity === 'string') {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useMemo(() => ({ entity: entity }), [entity])
	}
	// eslint-disable-next-line react-hooks/rules-of-hooks
	return useMemo(
		() => ({
			entity: {
				entityName: entity.entityName,
				filter: entity.filter,
				where: entity.where,
			},
		}),
		[entity.entityName, entity.filter, entity.where],
	)
}
