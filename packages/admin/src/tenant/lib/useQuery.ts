import type { GraphQlClient } from '@contember/client'
import { GraphQlClientVariables } from '@contember/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { QueryRequestObject, QueryRequestState } from './requestState'
import { JsonValue } from '@contember/react-binding'

const useJsonMemo = <V extends JsonValue>(value: V): V => {
	const json = useMemo(() => JSON.stringify(value), [value])
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(() => value, [json])
}

export const useQuery = <R, V extends GraphQlClientVariables>(
	client: GraphQlClient,
	query: string,
	variables: V,
	apiToken?: string,
): QueryRequestObject<R> => {
	const [state, setState] = useState<QueryRequestState<R>>({
		state: 'loading',
	})
	const vars = useJsonMemo(variables)
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
			setState({ state: 'error', error: e })
		}
	}, [client, query, vars, apiToken])

	useEffect(() => {
		refetch()
	}, [refetch])


	return useMemo(() => ({ state, refetch }), [state, refetch])
}
