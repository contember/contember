import type { EntityName, Filter } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { useContentApiRequest } from '@contember/react-client'
import { useEffect } from 'react'
import { useAbortController } from '@contember/react-utils'
import { DataBindingExtendAborted } from '@contember/binding'

export const useDataGridTotalCount = (entityName: EntityName, filter: Filter | undefined): number | undefined => {
	const [queryState, sendQuery] = useContentApiRequest<{
		data: { paginate: { pageInfo: { totalCount: number } } }
	}>()

	const abortController = useAbortController()

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
		(async () => {
			try {
				await sendQuery(query, undefined, {
					signal: abortController(),
				})
			} catch (e) {
				if (e instanceof Error && e.name === 'AbortError') {
					return
				}
				throw e
			}
		})()
	}, [abortController, query, sendQuery])

	if (queryState.readyState !== 'networkSuccess') {
		return undefined
	}
	return queryState.data.data.paginate.pageInfo.totalCount ?? undefined
}
