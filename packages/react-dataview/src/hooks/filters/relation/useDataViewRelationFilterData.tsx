import { ReactNode, useMemo } from 'react'
import { useDataViewFilter } from '../../index'
import { RelationFilterArtifacts } from '../../../filterTypes'
import { QueryLanguage, SugaredQualifiedEntityList } from '@contember/react-binding'
import { useEntityListSubTreeLoader, useEnvironment } from '@contember/react-binding'

export const useDataViewRelationFilterData = ({ name, children, options }: {
	name: string
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
}) => {
	const [artifact] = useDataViewFilter<RelationFilterArtifacts>(name)
	const env = useEnvironment()
	const entity = useMemo(() => QueryLanguage.desugarQualifiedEntityList({ entities: options }, env), [env, options])

	const entities = useMemo(() => {
		const allIds = [...(artifact?.id ?? []), ...(artifact?.notId ?? [])]
		if (!allIds.length) {
			return undefined
		}
		return ({
			entities: {
				entityName: entity.entityName,
				filter: {
					id: { in: allIds },
				},
			},
		})
	}, [artifact?.id, artifact?.notId, entity.entityName])

	return useEntityListSubTreeLoader(entities, children)
}
