import type { EntityName, Filter } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { useContentApiRequest } from '@contember/react-client'
import { useEffect, useRef } from 'react'

export const useHackyTotalCount = (entityName: EntityName, filter: Filter | undefined): number | undefined => {
	const [queryState, sendQuery] = useContentApiRequest<{
		data: { paginate: { pageInfo: { totalCount: number } } }
	}>()

	const loadAbortControllerRef = useRef<AbortController | undefined>(undefined)

	const query = new GraphQlBuilder.QueryBuilder().query(builder =>
		builder.object('paginate', builder => {
			builder = builder.name(`paginate${entityName}`).object('pageInfo', builder => builder.field('totalCount'))
			if (filter) {
				builder = builder.argument('filter', filter)
			}
			return builder
		}),
	)

	useEffect(() => {
		async function performEffect() {
			loadAbortControllerRef.current?.abort()

			const newController = new AbortController()
			loadAbortControllerRef.current = newController

			try {
				await sendQuery(query, undefined, {
					signal: newController.signal,
				})
			} catch {
				// TODO Distinguish abort vs actual error
				return
			}
		}
		performEffect()
	}, [query, sendQuery])

	if (queryState.readyState !== 'networkSuccess') {
		return undefined
	}
	return queryState.data.data.paginate.pageInfo.totalCount ?? undefined
}
