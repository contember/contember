import { createQueryBuilder, Filter, QualifiedEntityList, useEnvironment } from '@contember/react-binding'
import { ContentClient, GraphQlClientError } from '@contember/client'
import { useCurrentContentGraphQlClient } from '@contember/react-client'
import { useCallback, useEffect, useState } from 'react'
import { useAbortController } from '@contember/react-utils'

export type UseDataViewTotalCountArgs =
	& {
		entities: QualifiedEntityList
		filter: Filter<never>
	}

export const useDataViewTotalCount = ({ entities: { entityName }, filter }: UseDataViewTotalCountArgs): [number | undefined, { refresh: () => void }] => {
	const client = useCurrentContentGraphQlClient()
	const env = useEnvironment()

	const abortController = useAbortController()

	const [count, setCount] = useState<number | undefined>(undefined)
	const schema = env.getSchema()

	const calculateCount = useCallback(async () => {
		const contentClient = new ContentClient(client)
		const qb = createQueryBuilder(schema)
		const query = qb.count(entityName, {
			filter,
		})
		try {
			const result = await contentClient.query(query, {
				signal: abortController(),
			})
			setCount(result)
		} catch (e) {
			setCount(undefined)
			if ((e instanceof GraphQlClientError && e.type === 'aborted') || (e instanceof Error && e.name === 'AbortError')) {
				return
			}
			console.error(e)
		}

	}, [abortController, client, entityName, filter, schema])

	useEffect(() => {
		calculateCount()
	}, [calculateCount])

	return [count, { refresh: calculateCount }]
}
