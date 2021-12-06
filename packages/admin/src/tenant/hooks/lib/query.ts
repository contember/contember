import type { GraphQlClient } from '@contember/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { QueryRequestObject, QueryRequestState } from './requestState'

export const useJsonEqualMemo = <V>(memoFn: () => V, key: any): V => {
	const ref = useRef<{ key: string; value: V }>()

	const jsonKey = JSON.stringify(key)
	if (!ref.current || ref.current.key !== jsonKey) {
		ref.current = { key: jsonKey, value: memoFn() }
	}

	return ref.current.value
}

export const useQuery = <R, V>(
	client: GraphQlClient,
	query: string,
	variables: V,
	apiToken?: string,
): QueryRequestObject<R> => {
	const [state, setState] = useState<QueryRequestState<R>>({
		state: 'loading',
	})
	const vars = useJsonEqualMemo(() => variables, variables)
	const refetch = useCallback(async () => {
		setState({ state: 'loading' })
		try {
			const response = await client.sendRequest<{ data: R }>(query, {
				variables: vars,
				apiTokenOverride: apiToken,
			})
			setState({
				...response,
				state: 'success',
			})
		} catch (e) {
			setState({ state: 'error' })
			throw e
		}
	}, [client, query, vars, apiToken])

	useEffect(() => {
		refetch()
	}, [refetch])


	return useMemo(() => ({ state, refetch }), [state, refetch])
}
