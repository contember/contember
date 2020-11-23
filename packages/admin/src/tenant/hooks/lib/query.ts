import { GraphQlClient } from '@contember/client'
import * as React from 'react'
import { QueryRequestObject, QueryRequestState } from './requestState'

export const useJsonEqualMemo = <V>(memoFn: () => V, key: any): V => {
	const ref = React.useRef<{ key: string; value: V }>()

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
	const [state, setState] = React.useState<QueryRequestState<R>>({
		loading: true,
		finished: false,
		error: false,
	})
	const vars = useJsonEqualMemo(() => variables, variables)
	const fetch = React.useCallback((client: GraphQlClient, query: string, variables: V, apiToken?: string) => {
		if (client) {
			setState({ loading: true, finished: false, error: false })
			client
				.sendRequest<{ data: R }>(query, {
					variables,
					apiTokenOverride: apiToken,
				})
				.then(
					data => {
						setState({
							data: data.data,
							loading: false,
							finished: true,
							error: false,
						})
					},
					() => {
						setState({
							loading: false,
							finished: true,
							error: true,
						})
					},
				)
		}
	}, [])

	React.useEffect(() => {
		fetch(client, query, vars, apiToken)
	}, [client, query, vars, apiToken, fetch])

	const refetch = React.useCallback(() => {
		fetch(client, query, vars, apiToken)
	}, [client, query, vars, apiToken, fetch])

	return { state, refetch }
}
